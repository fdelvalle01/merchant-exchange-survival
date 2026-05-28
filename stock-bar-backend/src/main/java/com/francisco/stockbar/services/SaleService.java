package com.francisco.stockbar.services;

import com.francisco.stockbar.dto.SaleRequest;
import com.francisco.stockbar.dto.SaleResponse;
import com.francisco.stockbar.dto.OrderRequest;
import com.francisco.stockbar.dto.OrderResponse;
import com.francisco.stockbar.exception.ApiException;
import com.francisco.stockbar.model.OrderSide;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SaleService {

    private final OrderService orderService;

    @Transactional
    public SaleResponse registerSale(SaleRequest request) {
        validateRequest(request);

        OrderRequest orderRequest = new OrderRequest();
        orderRequest.setAssetId(request.getProductId());
        orderRequest.setSide(OrderSide.BUY);
        orderRequest.setQuantity(request.getQuantity());

        OrderResponse order = orderService.createOrder(orderRequest);
        return SaleResponse.from(order);
    }

    private void validateRequest(SaleRequest request) {
        if (request == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Request body requerido.");
        }

        if (request.getProductId() == null || request.getProductId() <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "productId debe ser un numero positivo.");
        }

        if (request.getQuantity() <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "quantity debe ser mayor que cero.");
        }
    }
}
