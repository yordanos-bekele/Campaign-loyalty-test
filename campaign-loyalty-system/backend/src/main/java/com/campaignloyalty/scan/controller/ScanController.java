package com.campaignloyalty.scan.controller;

import com.campaignloyalty.scan.dto.ScanRequest;
import com.campaignloyalty.scan.dto.ScanResponse;
import com.campaignloyalty.scan.service.ScanService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/scan")
@AllArgsConstructor
public class ScanController {

    private final ScanService scanService;

    @PostMapping
    public ResponseEntity<ScanResponse> scan(@CookieValue("device_id") String deviceId, @Valid @RequestBody ScanRequest request, HttpServletRequest httpRequest) {
        String ip = httpRequest.getRemoteAddr();
        String userAgent = httpRequest.getHeader("User-Agent");
        ScanResponse response = scanService.scan(deviceId, request.getToken(), ip, userAgent);
        return ResponseEntity.ok(response);
    }
}
