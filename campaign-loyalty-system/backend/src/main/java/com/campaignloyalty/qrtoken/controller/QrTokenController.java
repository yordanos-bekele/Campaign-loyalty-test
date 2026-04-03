package com.campaignloyalty.qrtoken.controller;

import com.campaignloyalty.qrtoken.entity.QrToken;
import com.campaignloyalty.qrtoken.service.QrTokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/qr-tokens")
public class QrTokenController {

    @Autowired
    private QrTokenService qrTokenService;

    @PostMapping("/generate/{hotelId}")
    public ResponseEntity<QrToken> generateToken(@PathVariable Long hotelId) {
        QrToken qrToken = qrTokenService.generateToken(hotelId);
        return ResponseEntity.ok(qrToken);
    }
}