package com.francisco.stockbar.services;

import org.springframework.stereotype.Component;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Component
public class DeterministicGameRng {

    public long value(long gameSeed, long day, long contextId, long position) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(
                    (gameSeed + ":" + day + ":" + contextId + ":" + position)
                            .getBytes(StandardCharsets.UTF_8)
            );
            return ByteBuffer.wrap(bytes).getLong() & Long.MAX_VALUE;
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is required for deterministic game RNG.", exception);
        }
    }

    public int index(int bound, long gameSeed, long day, long contextId, long position) {
        if (bound <= 0) {
            throw new IllegalArgumentException("RNG bound must be positive.");
        }
        return (int) (value(gameSeed, day, contextId, position) % bound);
    }

    public double unit(long gameSeed, long day, long contextId, long position) {
        return value(gameSeed, day, contextId, position) / (double) Long.MAX_VALUE;
    }
}
