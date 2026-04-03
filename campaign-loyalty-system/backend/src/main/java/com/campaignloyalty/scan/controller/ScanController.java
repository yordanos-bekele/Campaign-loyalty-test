package com.campaignloyalty.scan.controller;

import com.campaignloyalty.scan.dto.ScanRequest;
import com.campaignloyalty.scan.dto.ScanResponse;
import com.campaignloyalty.scan.service.ScanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/scan")
public class ScanController {

    @Autowired
    private ScanService scanService;

    @PostMapping
    public ResponseEntity<ScanResponse> scan(@CookieValue("device_id") String deviceId, @RequestBody ScanRequest request, HttpServletRequest httpRequest) {
        String ip = httpRequest.getRemoteAddr();
        String userAgent = httpRequest.getHeader("User-Agent");
        ScanResponse response = scanService.scan(deviceId, request.getToken(), ip, userAgent);
        return ResponseEntity.ok(response);
    }
}