package com.campaignloyalty.customer.controller;

import com.campaignloyalty.auth.service.AuthService;
import com.campaignloyalty.common.dto.ImportResultDto;
import com.campaignloyalty.customer.dto.LinkDeviceRequest;
import com.campaignloyalty.customer.dto.LoyalCustomerDto;
import com.campaignloyalty.customer.dto.RegisterCustomerRequest;
import com.campaignloyalty.customer.entity.Customer;
import com.campaignloyalty.customer.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@AllArgsConstructor
@Tag(name = "Customers", description = "Loyal customer registration and import endpoints")
public class CustomerController {

    private final CustomerService customerService;
    private final AuthService authService;

    @PostMapping("/register")
    @Operation(
            summary = "Register the current device as a loyal customer",
            description = "Stores a loyalty profile against the current device_id cookie or X-Device-Id header so future scans continue building reward progress.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Customer registered"),
                    @ApiResponse(responseCode = "400", description = "Invalid registration data", content = @Content(schema = @Schema(implementation = String.class)))
            }
    )
    public ResponseEntity<LoyalCustomerDto> registerCustomer(
            @CookieValue(value = "device_id", required = false) String cookieDeviceId,
            @RequestHeader(value = "X-Device-Id", required = false) String headerDeviceId,
            @Valid @RequestBody RegisterCustomerRequest request) {
        String deviceId = resolveDeviceId(cookieDeviceId, headerDeviceId);
        Customer customer = customerService.registerLoyalCustomer(
                deviceId,
                request.getFullName(),
                request.getPhoneNumber(),
                request.getEmail());
        return ResponseEntity.ok(toDto(customer));
    }

    @GetMapping("/me")
    @Operation(
            summary = "Get the loyal customer profile for the current device",
            description = "Returns the registered loyal customer profile for the current device_id cookie or X-Device-Id header.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Customer profile returned"),
                    @ApiResponse(responseCode = "204", description = "No loyal customer profile exists yet")
            }
    )
    public ResponseEntity<LoyalCustomerDto> getCurrentCustomer(
            @CookieValue(value = "device_id", required = false) String cookieDeviceId,
            @RequestHeader(value = "X-Device-Id", required = false) String headerDeviceId) {
        String deviceId = resolveDeviceId(cookieDeviceId, headerDeviceId);
        Customer customer = customerService.getRegisteredCustomerByDeviceId(deviceId);
        if (customer == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(toDto(customer));
    }

    @PostMapping("/link-device")
    @Operation(
            summary = "Link this device to an existing customer account via phone number",
            description = "Finds a registered customer by phone number and updates their device ID to the caller's current device ID. Use this when a user registered on one browser (e.g. Telegram WebView) and is now scanning from a different browser (e.g. Safari).",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Device linked successfully"),
                    @ApiResponse(responseCode = "400", description = "Phone number not found or device already linked", content = @Content(schema = @Schema(implementation = String.class)))
            }
    )
    public ResponseEntity<LoyalCustomerDto> linkDevice(
            @CookieValue(value = "device_id", required = false) String cookieDeviceId,
            @RequestHeader(value = "X-Device-Id", required = false) String headerDeviceId,
            @Valid @RequestBody LinkDeviceRequest request) {
        String deviceId = resolveDeviceId(cookieDeviceId, headerDeviceId);
        Customer customer = customerService.linkDeviceByPhone(deviceId, request.getPhoneNumber());
        return ResponseEntity.ok(toDto(customer));
    }

    @GetMapping
    @Operation(
            summary = "List loyal customers",
            description = "Returns all registered loyal customer profiles for admin management screens.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Customers returned")
            }
    )
    public ResponseEntity<List<LoyalCustomerDto>> getRegisteredCustomers(HttpSession session) {
        authService.requireAdmin(session);
        return ResponseEntity.ok(customerService.findRegisteredCustomers().stream().map(this::toDto).toList());
    }

    @PostMapping("/import")
    @Operation(
            summary = "Import loyal customers from Excel",
            description = "Creates or updates loyal customer records from the first worksheet in an uploaded Excel file.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Customer import completed"),
                    @ApiResponse(responseCode = "400", description = "Invalid file or import data", content = @Content(schema = @Schema(implementation = String.class)))
            }
    )
    public ResponseEntity<ImportResultDto> importCustomers(
            @RequestParam("file") MultipartFile file,
            HttpSession session) {
        authService.requireAdmin(session);
        return ResponseEntity.ok(customerService.importCustomersFromExcel(file));
    }

    private LoyalCustomerDto toDto(Customer customer) {
        return new LoyalCustomerDto(
                customer.getId(),
                customer.getDeviceId(),
                customer.getFullName(),
                customer.getPhoneNumber(),
                customer.getEmail(),
                customer.getRegisteredAt(),
                customer.getCreatedAt());
    }

    private String resolveDeviceId(String cookieDeviceId, String headerDeviceId) {
        if (StringUtils.hasText(cookieDeviceId)) {
            return cookieDeviceId;
        }
        if (StringUtils.hasText(headerDeviceId)) {
            return headerDeviceId;
        }
        throw new IllegalArgumentException("device_id cookie or X-Device-Id header is required");
    }
}
