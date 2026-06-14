import { act, fireEvent, render, renderHook, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CompanyDashboardApp from "../apps/CompanyDashboardApp";
import MarketBoardApp from "../apps/MarketBoardApp";
import PortfolioApp from "../apps/PortfolioApp";
import { useDesktopWindows } from "../hooks/useDesktopWindows";
import type { DesktopAppRenderProps, RelicResponse, SealedAuctionResponse } from "../types";
import {
  activateRelic,
  equipRelic,
  getAuction,
  selectAuctionCard,
  unequipRelic
} from "../services/relicsApi";
import { restartGame } from "../services/gameApi";
import ActiveRelicsBar from "./ActiveRelicsBar";
import CompanyHudLauncher from "./CompanyHudLauncher";
import SealedAuctionModal from "./SealedAuctionModal";
import Sidebar from "./Sidebar";
import VictoryProgress from "./VictoryProgress";

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

const book: RelicResponse = {
  ...ring,
  id: 89,
  code: "BOOK_OF_THREE_OMENS",
  name: "Book of Three Omens",
  targetType: "PRODUCT",
  iconKey: "book",
  status: "EQUIPPED",
  equippedSlot: 1,
  chargesRemaining: 1
};

const company = {
  id: 1,
  username: "trader",
  companyName: "Trader Trading Company",
  cash: 69500,
  debt: 0,
  companyValue: 97500,
  portfolioValue: 28000,
  realizedPnl: 2500,
  reputation: 50,
  riskLevel: "LOW",
  gameDay: 8,
  status: "ACTIVE",
  dailyBurnRate: 500,
  cashRunwayDays: 139,
  criticalDays: 0,
  victoryTarget: 1000000
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

function relicBar(relics: RelicResponse[] = []) {
  return (
    <ActiveRelicsBar
      relics={relics}
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
      isLoading={false}
      loadError={null}
      onChanged={vi.fn()}
      onCompanyChanged={vi.fn()}
    />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAuction).mockResolvedValue(auction);
});

describe("Phase 6A.1 desktop UX", () => {
  it("removes Company from the dock and opens Company Keep from the lower HUD", () => {
    const onOpen = vi.fn();
    const { rerender } = render(
      <Sidebar
        focusedApp={null}
        openAppIds={[]}
        userRoles={["TRADER"]}
        unreadNewsCount={0}
        onOpenApp={vi.fn()}
      />
    );
    expect(screen.queryByRole("button", { name: /Open Company Keep/i })).not.toBeInTheDocument();

    rerender(<CompanyHudLauncher company={company} isLoading={false} error={null} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole("button", { name: "OPEN COMPANY KEEP" }));
    expect(onOpen).toHaveBeenCalledOnce();
    expect(screen.getByText("Trader Trading Company")).toBeInTheDocument();
    expect(screen.getByText("139.0 days")).toBeInTheDocument();
  });

  it("focuses the existing Company Keep window instead of duplicating it", () => {
    const { result } = renderHook(() => useDesktopWindows(["company"]));
    act(() => {
      result.current.openWindow("company");
      result.current.openWindow("company");
    });
    expect(result.current.windows.filter((item) => item.appId === "company")).toHaveLength(1);
    expect(result.current.focusedWindow?.appId).toBe("company");
  });

  it("moves day and victory information out of Company Keep", () => {
    const { rerender } = render(<CompanyDashboardApp {...appProps({ company })} />);
    expect(screen.queryByText("Game Day")).not.toBeInTheDocument();
    expect(screen.queryByText("Victory Target")).not.toBeInTheDocument();
    expect(screen.getByText("Treasury / Cash")).toBeInTheDocument();

    rerender(<VictoryProgress company={company} />);
    expect(screen.getByText("VICTORY")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "10");
    expect(screen.getByLabelText(/Company value.*of/i)).toBeInTheDocument();
  });

  it("keeps Vault portfolio-only", () => {
    render(<PortfolioApp {...appProps({ relics: [ring] })} />);
    expect(screen.getByRole("heading", { name: "Vault" })).toBeInTheDocument();
    expect(screen.getByText("The vault contains no holdings.")).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "INVENTORY" })).not.toBeInTheDocument();
    expect(screen.queryByText("Ring of Last Mercy")).not.toBeInTheDocument();
  });

  it("opens the picker on the requested empty slot and equips directly into it", async () => {
    vi.mocked(equipRelic).mockResolvedValue({ ...ring, status: "EQUIPPED", equippedSlot: 3 });
    render(relicBar([ring]));

    fireEvent.click(screen.getByRole("button", { name: /Empty relic slot 3/i }));
    expect(screen.getByRole("dialog", { name: "Relic inventory for slot 3" })).toBeInTheDocument();
    expect(screen.getByText("Ring of Last Mercy")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "EQUIP" }));

    await waitFor(() => expect(equipRelic).toHaveBeenCalledWith(88, 3));
    expect(activateRelic).not.toHaveBeenCalled();
  });

  it("shows equipped relics disabled in the picker and renders the empty state", () => {
    const { rerender } = render(relicBar([book]));
    fireEvent.click(screen.getByRole("button", { name: /Empty relic slot 4/i }));
    const item = screen.getByText("Book of Three Omens").closest("article");
    expect(item).not.toBeNull();
    expect(within(item!).getByRole("button", { name: "EQUIP" })).toBeDisabled();

    rerender(relicBar([]));
    fireEvent.click(screen.getByRole("button", { name: /Empty relic slot 4/i }));
    expect(screen.getByText("NO RELICS AVAILABLE")).toBeInTheDocument();
  });

  it("opens occupied detail, requires a Book target, and confirms use once", async () => {
    vi.mocked(activateRelic).mockResolvedValue({
      relic: { ...book, status: "CONSUMED", equippedSlot: undefined, chargesRemaining: 0 },
      cash: 69500,
      targetProductName: "Ironhill Mines",
      confidence: "HIGH",
      forecast: [
        { dayOffset: 1, outlook: "BULLISH" },
        { dayOffset: 2, outlook: "STABLE" },
        { dayOffset: 3, outlook: "VOLATILE" }
      ]
    });
    render(relicBar([book]));

    fireEvent.click(screen.getByRole("button", { name: /Slot 1, Book of Three Omens/i }));
    const useButton = screen.getByRole("button", { name: "USE" });
    expect(useButton).toBeDisabled();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "7" } });
    expect(useButton).toBeEnabled();
    fireEvent.click(useButton);
    const confirmButton = screen.getByRole("button", { name: "CONFIRM USE" });
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);

    await waitFor(() => expect(activateRelic).toHaveBeenCalledTimes(1));
    expect(activateRelic).toHaveBeenCalledWith(89, 7);
  });

  it("supports Escape focus return, hotkeys and drag/drop without activation", async () => {
    vi.mocked(equipRelic).mockResolvedValue({ ...ring, status: "EQUIPPED", equippedSlot: 2 });
    render(relicBar([book]));
    const emptySlot = screen.getByRole("button", { name: /Empty relic slot 2/i });
    fireEvent.click(emptySlot);
    expect(screen.getByRole("dialog", { name: /Relic inventory for slot 2/i })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(emptySlot).toHaveFocus());

    fireEvent.keyDown(window, { key: "1" });
    expect(screen.getByRole("dialog", { name: /Book of Three Omens detail/i })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.keyDown(window, { key: "4" });
    expect(screen.getByRole("dialog", { name: /Relic inventory for slot 4/i })).toBeInTheDocument();

    const dataTransfer = { getData: vi.fn(() => "88"), setData: vi.fn() };
    fireEvent.drop(screen.getByRole("button", { name: /Empty relic slot 2/i }), { dataTransfer });
    await waitFor(() => expect(equipRelic).toHaveBeenCalledWith(88, 2));
    expect(activateRelic).not.toHaveBeenCalled();
  });

  it("renders AVAILABLE, CLAIMED and EXPIRED auction rows without reopening settled auctions", () => {
    const onOpenAuction = vi.fn();
    const { rerender } = render(
      <MarketBoardApp {...appProps({ activeAuction: auction, onOpenAuction })} />
    );
    expect(screen.getAllByText("????")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "OPEN" }));
    expect(onOpenAuction).toHaveBeenCalledOnce();

    rerender(
      <MarketBoardApp
        {...appProps({
          activeAuction: {
            ...auction,
            status: "RESOLVED",
            selectedCardPosition: 2,
            selectedOutcomePolarity: "POSITIVE",
            selectedOutcomeCode: "BOOK_OF_THREE_OMENS",
            selectedOutcomeTitle: "Book of Three Omens",
            selectedOutcomeDescription: book.description,
            selectedRelic: book
          },
          onOpenAuction
        })}
      />
    );
    expect(screen.getAllByText("CLAIMED")).toHaveLength(2);
    expect(screen.getByText(/Book of Three Omens resolved/i)).toBeInTheDocument();
    expect(screen.queryByText("????")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "OPEN" })).not.toBeInTheDocument();

    rerender(
      <MarketBoardApp {...appProps({ activeAuction: { ...auction, status: "EXPIRED" }, onOpenAuction })} />
    );
    expect(screen.getAllByText("EXPIRED")).toHaveLength(2);
    expect(screen.getByText(/No lot was claimed/i)).toBeInTheDocument();
  });

  it("reveals one auction reward, marks three lots LOST and never exposes their content", async () => {
    vi.mocked(selectAuctionCard).mockResolvedValue({
      auctionId: 15,
      status: "RESOLVED",
      selectedCardPosition: 2,
      selectedOutcomePolarity: "POSITIVE",
      selectedOutcomeCode: "BOOK_OF_THREE_OMENS",
      selectedOutcomeTitle: "Book of Three Omens",
      selectedOutcomeDescription: book.description,
      relic: book,
      cash: 90000
    });
    render(<SealedAuctionModal auction={auction} onClose={vi.fn()} onResolved={vi.fn()} />);
    await waitFor(() => expect(getAuction).toHaveBeenCalledWith(15));

    fireEvent.click(screen.getByRole("button", { name: /^LOT II\b/i }));
    fireEvent.click(screen.getByRole("button", { name: "CLAIM SELECTED LOT" }));
    fireEvent.click(screen.getByRole("button", { name: "CONFIRM CLAIM" }));

    await screen.findByText("THE REMAINING LOTS ARE LOST");
    expect(screen.getAllByText("LOST")).toHaveLength(3);
    expect(screen.getAllByText("LOT LOST")).toHaveLength(3);
    expect(screen.queryByText("????")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "CONTINUE" })).toBeInTheDocument();
    expect(screen.queryByText("SEND TO INVENTORY")).not.toBeInTheDocument();
    expect(screen.queryByText("Fortune Draught")).not.toBeInTheDocument();
  });

  it("restarts a terminal company only after an in-platform confirmation", async () => {
    vi.mocked(restartGame).mockResolvedValue({ ...company, gameDay: 1, status: "ACTIVE" });
    const onCompanyChanged = vi.fn();
    render(
      <CompanyDashboardApp
        {...appProps({
          company: {
            ...company,
            cash: -415,
            companyValue: -415,
            realizedPnl: -3915,
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
    expect(restartGame).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "CONFIRM NEW GAME" }));
    await waitFor(() => expect(restartGame).toHaveBeenCalledOnce());
    expect(onCompanyChanged).toHaveBeenCalledOnce();
  });
});
