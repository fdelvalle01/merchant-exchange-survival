package com.francisco.stockbar.repository;

import com.francisco.stockbar.model.MarketOrder;
import com.francisco.stockbar.model.OrderSide;
import com.francisco.stockbar.model.OrderStatus;
import com.francisco.stockbar.model.PlayerCompany;
import com.francisco.stockbar.model.Product;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface MarketOrderRepository extends JpaRepository<MarketOrder, Long> {
    List<MarketOrder> findByPlayerCompanyOrderByCreatedAtDesc(PlayerCompany playerCompany);

    @Query("""
            select coalesce(sum(marketOrder.quantity), 0)
            from MarketOrder marketOrder
            where marketOrder.product = :product
              and marketOrder.side = :side
              and marketOrder.status = :status
              and marketOrder.createdAt >= :since
            """)
    Long sumQuantityByProductAndSideSince(
            @Param("product") Product product,
            @Param("side") OrderSide side,
            @Param("status") OrderStatus status,
            @Param("since") LocalDateTime since
    );
}
