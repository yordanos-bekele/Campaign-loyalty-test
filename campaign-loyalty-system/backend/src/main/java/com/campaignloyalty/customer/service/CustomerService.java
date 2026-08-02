package com.campaignloyalty.customer.service;

import com.campaignloyalty.customer.entity.Customer;
import com.campaignloyalty.customer.repository.CustomerRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@AllArgsConstructor
@Slf4j
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final DataFormatter dataFormatter = new DataFormatter();

    public Customer findOrCreateByDeviceId(String deviceId) {
        log.debug("Resolving customer for deviceId={}", deviceId);
        Customer customer = customerRepository.findByDeviceId(deviceId);
        if (customer == null) {
            log.info("Creating new customer for deviceId={}", deviceId);
            customer = new Customer();
            customer.setDeviceId(deviceId);
            customer = customerRepository.save(customer);
        } else {
            log.debug("Found existing customerId={} for deviceId={}", customer.getId(), deviceId);
        }
        return customer;
    }

    public Customer registerLoyalCustomer(String deviceId, String fullName, String phoneNumber, String email) {
        if (deviceId == null || deviceId.isBlank()) {
            log.info("No deviceId cookie or X-Device-Id header provided");
            throw new IllegalArgumentException("device_id cookie or X-Device-Id header is required");
        }

        String normalizedFullName = requireValue(fullName, "full name is required");
        String normalizedPhoneNumber = requireValue(phoneNumber, "phone number is required");
        String normalizedEmail = normalizeOptional(email);

        Customer customer = findOrCreateByDeviceId(deviceId);
        ensureUniqueContactDetails(customer.getId(), normalizedPhoneNumber, normalizedEmail);

        customer.setFullName(normalizedFullName);
        customer.setPhoneNumber(normalizedPhoneNumber);
        customer.setEmail(normalizedEmail);
        if (customer.getRegisteredAt() == null) {
            customer.setRegisteredAt(LocalDateTime.now());
        }

        Customer savedCustomer = customerRepository.save(customer);
        log.info("Loyal customer registered customerId={} deviceId={}", savedCustomer.getId(),
                savedCustomer.getDeviceId());
        return savedCustomer;
    }

    public Customer getRegisteredCustomerByDeviceId(String deviceId) {
        if (deviceId == null || deviceId.isBlank()) {
            return null;
        }
        Customer customer = customerRepository.findByDeviceId(deviceId);
        if (customer == null || customer.getRegisteredAt() == null) {
            return null;
        }
        if (customer.getFullName() == null || customer.getFullName().isBlank()) {
            return null;
        }
        if (customer.getPhoneNumber() == null || customer.getPhoneNumber().isBlank()) {
            return null;
        }
        return customer;
    }

    public Customer linkDeviceByPhone(String newDeviceId, String phoneNumber) {
        if (newDeviceId == null || newDeviceId.isBlank()) {
            log.info("No deviceId cookie or X-Device-Id header provided when trying to link device by phone");
            throw new IllegalArgumentException("device_id cookie or X-Device-Id header is required");
        }
        String normalizedPhone = requireValue(phoneNumber, "phone number is required");

        Customer customer = customerRepository.findByPhoneNumber(normalizedPhone);
        if (customer == null || customer.getRegisteredAt() == null) {
            log.warn("No registered customer found with that phone number when trying to link device by phone");
            throw new IllegalArgumentException(
                    "No registered customer found with that phone number. Please register first.");
        }

        // Check if another customer already owns this new device ID (edge case: race
        // condition).
        Customer existingOwner = customerRepository.findByDeviceId(newDeviceId);
        if (existingOwner != null && !existingOwner.getId().equals(customer.getId())) {
            log.info("This device is already linked to a different account when trying to link device by phone");
            throw new IllegalArgumentException("This device is already linked to a different account.");
        }

        customer.setDeviceId(newDeviceId);
        Customer savedCustomer = customerRepository.save(customer);
        log.info("Device re-linked via phone number customerId={} newDeviceId={}", savedCustomer.getId(), newDeviceId);
        return savedCustomer;
    }

    public List<Customer> findRegisteredCustomers() {
        log.info("Loading registered loyal customers");
        return customerRepository.findAllByRegisteredAtIsNotNullOrderByRegisteredAtDesc();
    }

    public com.campaignloyalty.common.dto.ImportResultDto importCustomersFromExcel(MultipartFile file) {
        validateImportFile(file);
        log.info("Starting loyal customer Excel import filename={}", file.getOriginalFilename());

        int processedCount = 0;
        int createdCount = 0;
        int updatedCount = 0;
        int skippedCount = 0;
        List<String> errors = new ArrayList<>();

        try (InputStream inputStream = file.getInputStream(); XSSFWorkbook workbook = new XSSFWorkbook(inputStream)) {
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null || sheet.getPhysicalNumberOfRows() == 0) {
                throw new IllegalArgumentException("Excel file is empty");
            }

            Map<String, Integer> headers = readHeaders(sheet.getRow(sheet.getFirstRowNum()));
            requireHeaders(headers, "full name", "phone number");

            for (int rowIndex = sheet.getFirstRowNum() + 1; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                if (row == null || isBlankRow(row)) {
                    continue;
                }

                processedCount++;
                try {
                    String fullName = requireValue(readCell(row, headers, "full name"), "full name is required");
                    String phoneNumber = requireValue(readCell(row, headers, "phone number"),
                            "phone number is required");
                    String email = normalizeOptional(readCell(row, headers, "email"));
                    String deviceId = normalizeOptional(readCell(row, headers, "device id"));

                    Customer customer = resolveImportCustomer(deviceId, phoneNumber, email);
                    boolean existingCustomer = customer.getId() != null;

                    if (customer.getDeviceId() == null || customer.getDeviceId().isBlank()) {
                        customer.setDeviceId(deviceId != null ? deviceId : "imported-" + UUID.randomUUID());
                    }

                    ensureUniqueContactDetails(customer.getId(), phoneNumber, email);

                    customer.setFullName(fullName);
                    customer.setPhoneNumber(phoneNumber);
                    customer.setEmail(email);
                    if (customer.getRegisteredAt() == null) {
                        customer.setRegisteredAt(LocalDateTime.now());
                    }

                    customerRepository.save(customer);
                    if (existingCustomer) {
                        updatedCount++;
                    } else {
                        createdCount++;
                    }
                } catch (IllegalArgumentException rowError) {
                    skippedCount++;
                    errors.add("Row " + (rowIndex + 1) + ": " + rowError.getMessage());
                }
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("Could not read Excel file");
        }

        log.info("Completed loyal customer import processed={} created={} updated={} skipped={}",
                processedCount, createdCount, updatedCount, skippedCount);
        return new com.campaignloyalty.common.dto.ImportResultDto(
                processedCount,
                createdCount,
                updatedCount,
                skippedCount,
                errors);
    }

    private Customer resolveImportCustomer(String deviceId, String phoneNumber, String email) {
        Customer customer = null;
        if (deviceId != null) {
            customer = customerRepository.findByDeviceId(deviceId);
        }
        if (customer == null) {
            customer = customerRepository.findByPhoneNumber(phoneNumber);
        }
        if (customer == null && email != null) {
            customer = customerRepository.findByEmailIgnoreCase(email);
        }
        return customer != null ? customer : new Customer();
    }

    private void ensureUniqueContactDetails(Integer customerId, String phoneNumber, String email) {
        Customer byPhoneNumber = customerRepository.findByPhoneNumber(phoneNumber);
        if (byPhoneNumber != null && !byPhoneNumber.getId().equals(customerId)) {
            throw new IllegalArgumentException("phone number already belongs to another customer");
        }

        if (email != null) {
            Customer byEmail = customerRepository.findByEmailIgnoreCase(email);
            if (byEmail != null && !byEmail.getId().equals(customerId)) {
                throw new IllegalArgumentException("email already belongs to another customer");
            }
        }
    }

    private void validateImportFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Excel file is required");
        }
    }

    private Map<String, Integer> readHeaders(Row headerRow) {
        if (headerRow == null) {
            throw new IllegalArgumentException("Excel header row is missing");
        }

        Map<String, Integer> headers = new LinkedHashMap<>();
        for (Cell cell : headerRow) {
            String headerValue = normalizeHeader(dataFormatter.formatCellValue(cell));
            if (!headerValue.isBlank()) {
                headers.put(headerValue, cell.getColumnIndex());
            }
        }
        return headers;
    }

    private void requireHeaders(Map<String, Integer> headers, String... requiredHeaders) {
        for (String requiredHeader : requiredHeaders) {
            if (!headers.containsKey(normalizeHeader(requiredHeader))) {
                throw new IllegalArgumentException("Missing required header: " + requiredHeader);
            }
        }
    }

    private String readCell(Row row, Map<String, Integer> headers, String headerName) {
        Integer columnIndex = headers.get(normalizeHeader(headerName));
        if (columnIndex == null) {
            return null;
        }
        Cell cell = row.getCell(columnIndex);
        return cell == null ? null : normalizeOptional(dataFormatter.formatCellValue(cell));
    }

    private boolean isBlankRow(Row row) {
        for (Cell cell : row) {
            String cellValue = normalizeOptional(dataFormatter.formatCellValue(cell));
            if (cellValue != null && !cellValue.isBlank()) {
                return false;
            }
        }
        return true;
    }

    private String requireValue(String value, String errorMessage) {
        String normalizedValue = normalizeOptional(value);
        if (normalizedValue == null) {
            throw new IllegalArgumentException(errorMessage);
        }
        return normalizedValue;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalizedValue = value.trim();
        return normalizedValue.isEmpty() ? null : normalizedValue;
    }

    private String normalizeHeader(String header) {
        return header.toLowerCase(Locale.ROOT).replace("_", " ").replace("-", " ").trim();
    }
}
