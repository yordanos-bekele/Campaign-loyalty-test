package com.campaignloyalty.qrtoken.repository;

import com.campaignloyalty.qrtoken.entity.QrToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface QrTokenRepository extends JpaRepository<QrToken, Integer> {

    QrToken findByToken(String token);

    List<QrToken> findByExpiresAtBefore(LocalDateTime now);
}
