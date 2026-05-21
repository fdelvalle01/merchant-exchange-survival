package com.francisco.stockbar.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "price")
public class PriceProperties {

    /** % de subida por unidad (antes hardcodeado) */
    private BigDecimal impactFactor = BigDecimal.valueOf(0.005);
    /** Tope superior relativo al basePrice */
    private BigDecimal maxMultiplier  = BigDecimal.valueOf(1.20);
    /** Tope inferior relativo al basePrice */
    private BigDecimal minMultiplier  = BigDecimal.valueOf(0.80);

    /** Intervalo en ms para actualizar precios */
    private long updateRateMillis    = 30000;
    /** Intervalo en ms para degradar precios */
    private long degradeRateMillis   = 30000;
    /** Segundos sin venta antes de empezar a degradar */
    private long degradeThresholdSeconds = 60;
    /** % de caída por minuto (hasta degradeMaxPct) */
    private BigDecimal degradePerMinutePct = BigDecimal.valueOf(0.01);
    /** % máximo de caída absoluta por inactividad */
    private BigDecimal degradeMaxPct       = BigDecimal.valueOf(0.30);

    /** Ventanas de Happy Hour con sus parámetros propios */
    private List<HappyHourWindow> happyHours;

    @Getter
    @Setter
    public static class HappyHourWindow {
        /** Hora de inicio (p. ej. "18:00") */
        private LocalTime start;
        /** Hora de fin (p. ej. "20:00") */
        private LocalTime end;
        /** Impact factor durante happy hour */
        private BigDecimal impactFactor;
        /** Techo relativo durante happy hour */
        private BigDecimal maxMultiplier;
        /** Umbral en segundos antes de degradar en happy hour */
        private long degradeThresholdSeconds;
        /** % de caída por minuto en happy hour */
        private BigDecimal degradePerMinutePct;
        /** % de descuento inicial al arrancar la franja */
        private BigDecimal initialDiscountPct;
    }
}
