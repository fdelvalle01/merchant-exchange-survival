package com.francisco.stockbar.services;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class DeterministicGameRngTest {

    private final DeterministicGameRng rng = new DeterministicGameRng();

    @Test
    void sameInputsAlwaysProduceSameValue() {
        long first = rng.value(4242L, 7L, 15L, 2L);
        long second = rng.value(4242L, 7L, 15L, 2L);

        assertThat(second).isEqualTo(first);
        assertThat(rng.index(3, 4242L, 7L, 15L, 2L)).isBetween(0, 2);
    }

    @Test
    void cardPositionChangesTheGeneratedValue() {
        assertThat(rng.value(4242L, 7L, 15L, 1L))
                .isNotEqualTo(rng.value(4242L, 7L, 15L, 2L));
    }
}
