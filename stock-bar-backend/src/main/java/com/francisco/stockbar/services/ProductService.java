package com.francisco.stockbar.services;

import com.francisco.stockbar.model.Product;
import com.francisco.stockbar.repository.ProductRepository;
import org.springframework.stereotype.Service;
import com.francisco.stockbar.dto.ProductDTO;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<ProductDTO> getAllWithDiffs() {
        return productRepository.findAll().stream().map(p -> {
            BigDecimal currentPrice = p.getCurrentPrice();
            BigDecimal basePrice = p.getBasePrice();
            BigDecimal maxPrice = p.getMaxPrice() != null ? p.getMaxPrice() : basePrice;
            BigDecimal priceChange = currentPrice.subtract(basePrice);
            BigDecimal percentageChange = BigDecimal.ZERO;
    
            
            if (basePrice.compareTo(BigDecimal.ZERO) > 0) {
                percentageChange = priceChange
                    .divide(basePrice, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
            }
            
            BigDecimal dropFromMax = maxPrice.subtract(currentPrice);
            double percentageDropFromMax = 0.0;

            if (maxPrice.compareTo(BigDecimal.ZERO) > 0 && dropFromMax.compareTo(BigDecimal.ZERO) > 0) {
                percentageDropFromMax = dropFromMax
                    .divide(maxPrice, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
            }
                
    
            String trend;
            System.out.println(p.getName());
            System.out.println("currenPrice: "+currentPrice +" basePrice: " + basePrice);
            if (currentPrice.compareTo(basePrice) > 0) {
                trend = "up";
                System.out.println("Subiendo Precios"+currentPrice +" > " + basePrice);
            } else if (currentPrice.compareTo(basePrice) < 0) {
                System.out.println("Bajando Precios (currenPrice:)"+currentPrice +" <" + basePrice);
                trend = "down";
            } else {
                System.out.println("Vuelta a precios base");
                trend = "flat";
            }
    
            return ProductDTO.builder()
                .id(p.getId())
                .name(p.getName())
                .basePrice(basePrice.doubleValue())
                .currentPrice(currentPrice.doubleValue())
                .priceChange(priceChange.doubleValue())
                .percentageChange(percentageChange.doubleValue())
                .percentageDropFromMax(percentageDropFromMax)
                .trend(trend)
                .imageUrl(p.getImageUrl())
                .build();
        }).collect(Collectors.toList());
    }
    
}
