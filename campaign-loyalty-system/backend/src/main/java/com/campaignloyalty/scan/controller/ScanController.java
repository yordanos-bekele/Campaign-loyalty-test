package com.campaignloyalty.scan.controller;

import com.campaignloyalty.scan.dto.ScanRequest;
import com.campaignloyalty.scan.dto.ScanResponse;
import com.campaignloyalty.scan.service.ScanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/scan")
@AllArgsConstructor
@Tag(name = "Scan", description = "QR scan and loyalty progress endpoints")
public class ScanController {

    private final ScanService scanService;

    @PostMapping
    @Operation(
            summary = "Submit a QR scan",
            description = "Validates a QR token, applies scan limits, updates customer progress, and awards a reward on the 10th valid scan.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Scan processed successfully"),
                    @ApiResponse(responseCode = "400", description = "Invalid request or missing device cookie", content = @Content(schema = @Schema(implementation = String.class)))
            }
    )
    public ResponseEntity<ScanResponse> scan(
            @Parameter(description = "Unique device identifier stored as a cookie", example = "device-1")
            @CookieValue("device_id") String deviceId,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "QR token payload",
                    required = true,
                    content = @Content(schema = @Schema(implementation = ScanRequest.class), examples = {
                            @ExampleObject(name = "Valid request", value = "{\"token\":\"7e8f6a18-3c35-4a69-b5e5-970ca8e19e66\"}")
                    })
            )
            @Valid @RequestBody ScanRequest request,
            HttpServletRequest httpRequest) {
        String ip = httpRequest.getRemoteAddr();
        String userAgent = httpRequest.getHeader("User-Agent");
        ScanResponse response = scanService.scan(deviceId, request.getToken(), ip, userAgent);
        return ResponseEntity.ok(response);
    }
}
