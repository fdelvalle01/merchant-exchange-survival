import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MarketBoardApp from "../apps/MarketBoardApp";
import CompanyDashboardApp from "../apps/CompanyDashboardApp";
import PortfolioApp from "../apps/PortfolioApp";
import type { DesktopAppRenderProps, RelicResponse, SealedAuctionResponse } from "../types";
import ActiveRelicsBar from "./ActiveRelicsBar";
import SealedAuctionModal from "./SealedAuctionModal";
import {
  activateRelic,
  equipRelic,
  getAuction,
  selectAuctionCard,
  unequipRelic
} from "../services/relicsApi";
import { restartGame } from "../services/gameApi";

vi.mock("../services/relicsApi", async () => {
  const actual = await vi.importActual<typeof import("../services/relicsApi")>("../services/relicsApi");
  return {
    ...actual,
    getAuction: vi.fn(),
    selectAuctionCard: vi.fn(),
    equipRelic: vi.fn(),
    unequipRelic: vi.fn(),
    activateRelic: vi.fn()
  };
});

vi.mock("../services/gameApi", () => ({
  endDay: vi.fn(),
  restartGame: vi.fn()
}));

const auction: SealedAuctionResponse = {
  id: 15,
  title: "The Auction of Four Fates",
  entryCost: 10000,
  availableFromDay: 1,
  closesAtDay: 1,
  daysRemaining: 0,
  status: "AVAILABLE",
  cards: [1, 2, 3, 4].map((position) => ({ position, revealed: false, selected: false }))
};

const ring: RelicResponse = {
  id: 88,
  code: "RING_OF_LAST_MERCY",
  name: "Ring of Last Mercy",
  description: "Prevents bankruptcy during the next two End Day evaluations.",
  category: "PASSIVE",
  targetType: "COMPANY",
  activationType: "MANUAL",
  durationDays: 2,
  effectType: "BANKRUPTCY_PROTECTION",
  iconKey: "ring",
  status: "IN_INVENTORY",
  acquiredAtDay: 1
};

function appProps(overrides: Partial<DesktopAppRenderProps> = {}): DesktopAppRenderProps {
  return {
    currentUser: { name: "Trader", username: "trader", role: "TRADER", roles: ["TRADER"] },
    company: null,
    portfolio: [],
    products: [],
    selectedProduct: undefined,
    onSelectProduct: vi.fn(),
    onOrderCreated: vi.fn(),
    onProductsChanged: vi.fn(),
    onCompanyChanged: vi.fn(),
    onPortfolioChanged: vi.fn(),
    onOrdersChanged: vi.fn(),
    onNewsChanged: vi.fn(),
    onMarketEventsChanged: vi.fn(),
    onGameItemsChanged: vi.fn(),
    localOrders: [],
    addFilledOrder: vi.fn(),
    addRejectedOrder: vi.fn(),
    clearOrders: vi.fn(),
    isLoadingOrders: false,
    ordersError: null,
    worldNews: [],
    isLoadingNews: false,
    newsError: null,
    marketEvents: [],
    addMarketEvent: vi.fn(),
    clearMarketEvents: vi.fn(),
    isActive: true,
    isLoadingCompany: false,
    companyError: null,
    isLoadingPortfolio: false,
    portfolioError: null,
    isLoadingProducts: false,
    productsError: null,
    relics: [],
    activeAuction: null,
    isLoadingRelics: false,
    relicsError: null,
    onOpenAuction: vi.fn(),
    onRetryProducts: vi.fn(),
    onOpenApp: vi.fn(),
    ...overrides
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAuction).mockResolvedValue(auction);
});

describe("Phase 6A desktop UI", () => {
  it("renders the sealed auction as a special non-product Market Board row", () => {
    const onOpenAuction = vi.fn();
    render(<MarketBoardApp {...appProps({ activeAuction: auction, onOpenAuction })} />);

    expect(screen.getByText("ROYAL SEALED AUCTION")).toBeInTheDocument();
    expect(screen.getByText("CLOSES TODAY")).toBeInTheDocument();
    expect(screen.getAllByText("????")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "OPEN" }));
    expect(onOpenAuction).toHaveBeenCalledOnce();
  });

  it("renders four sealed cards, confirms one choice and reveals only the selected reward", async () => {
    vi.mocked(selectAuctionCard).mockResolvedValue({
      auctionId: 15,
      status: "RESOLVED",
      selectedCardPosition: 2,
      relic: { ...ring, id: 99, code: "BOOK_OF_THREE_OMENS", name: "Book of Three Omens", iconKey: "book" },
      cash: 90000
    });
    const onResolved = vi.fn();
    render(<SealedAuctionModal auction={auction} onClose={vi.fn()} onResolved={onResolved} />);

    expect(screen.getAllByText("????")).toHaveLength(4);
    fireEvent.click(screen.getByRole("button", { name: /^LOT II\b/i }));
    expect(screen.getByRole("button", { name: /^LOT II\b/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /^LOT I\b/i })).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(screen.getByRole("button", { name: "CLAIM SELECTED LOT" }));
    expect(screen.getByText(/Confirm Lot II/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "CONFIRM CLAIM" }));

    await waitFor(() => expect(selectAuctionCard).toHaveBeenCalledWith(15, 2));
    expect(await screen.findAllByText("Book of Three Omens")).toHaveLength(2);
    expect(onResolved).toHaveBeenCalledOnce();
  });

  it("shows Vault inventory empty state and accessible slot actions", () => {
    const { rerender } = render(<PortfolioApp {...appProps()} />);
    fireEvent.click(screen.getByRole("tab", { name: "INVENTORY" }));
    expect(screen.getByText("No relics acquired.")).toBeInTheDocument();

    rerender(<PortfolioApp {...appProps({ relics: [ring] })} />);
    expect(screen.getByText("Ring of Last Mercy")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "SLOT 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "SLOT 4" })).toBeInTheDocument();
  });

  it("renders four slots and persists a dropped inventory relic", async () => {
    vi.mocked(equipRelic).mockResolvedValue({ ...ring, status: "EQUIPPED", equippedSlot: 3 });
    const onChanged = vi.fn();
    render(
      <ActiveRelicsBar
        relics={[]}
        products={[]}
        canManage
        onChanged={onChanged}
        onCompanyChanged={vi.fn()}
      />
    );

    const slots = screen.getAllByTitle(/Empty relic slot/);
    expect(slots).toHaveLength(4);
    const dataTransfer = {
      getData: vi.fn(() => "88"),
      setData: vi.fn()
    };
    fireEvent.drop(slots[2], { dataTransfer });

    await waitFor(() => expect(equipRelic).toHaveBeenCalledWith(88, 3));
    expect(onChanged).toHaveBeenCalledOnce();
    expect(unequipRelic).not.toHaveBeenCalled();
    expect(activateRelic).not.toHaveBeenCalled();
  });

  it("uses an in-platform confirmation before activating a targeted relic", async () => {
    const book: RelicResponse = {
      ...ring,
      code: "BOOK_OF_THREE_OMENS",
      name: "Book of Three Omens",
      targetType: "PRODUCT",
      status: "EQUIPPED",
      equippedSlot: 1,
      chargesRemaining: 1
    };
    vi.mocked(activateRelic).mockResolvedValue({
      relic: { ...book, status: "CONSUMED", equippedSlot: undefined, chargesRemaining: 0 },
      targetProductName: "Ironhill Mines",
      confidence: "HIGH",
      forecast: [
        { dayOffset: 1, outlook: "BULLISH" },
        { dayOffset: 2, outlook: "STABLE" },
        { dayOffset: 3, outlook: "VOLATILE" }
      ]
    });

    render(
      <ActiveRelicsBar
        relics={[book]}
        products={[{
          id: 7,
          name: "Ironhill Mines",
          sector: "MINING",
          currentPrice: 5100,
          basePrice: 5000,
          maxPrice: 5100,
          enabled: true
        }]}
        canManage
        onChanged={vi.fn()}
        onCompanyChanged={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTitle(/Book of Three Omens/));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "7" } });
    fireEvent.click(screen.getByRole("button", { name: "USE" }));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText(/Consume one charge.*Ironhill Mines/i)).toBeInTheDocument();
    expect(activateRelic).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "CONFIRM USE" }));
    await waitFor(() => expect(activateRelic).toHaveBeenCalledWith(88, 7));
  });

  it("restarts a terminal company only after an in-platform confirmation", async () => {
    vi.mocked(restartGame).mockResolvedValue({
      id: 1,
      username: "trader",
      companyName: "Trader Trading Company",
      cash: 100000,
      debt: 0,
      companyValue: 100000,
      realizedPnl: 0,
      reputation: 50,
      riskLevel: "LOW",
      gameDay: 1,
      status: "ACTIVE"
    });
    const onCompanyChanged = vi.fn();
    render(
      <CompanyDashboardApp
        {...appProps({
          company: {
            id: 1,
            username: "trader",
            companyName: "Trader Trading Company",
            cash: -415,
            debt: 0,
            companyValue: -415,
            realizedPnl: -3915,
            reputation: 50,
            riskLevel: "CRITICAL",
            gameDay: 90,
            status: "BANKRUPT",
            bankruptcyReason: "Company value fell below zero."
          },
          onCompanyChanged
        })}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "START AGAIN" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText(/Shared market prices.*remain unchanged/i)).toBeInTheDocument();
    expect(restartGame).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "CONFIRM NEW GAME" }));
    await waitFor(() => expect(restartGame).toHaveBeenCalledOnce());
    expect(onCompanyChanged).toHaveBeenCalledOnce();
  });
});
