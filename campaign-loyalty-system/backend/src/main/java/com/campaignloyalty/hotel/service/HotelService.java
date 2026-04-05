package com.campaignloyalty.hotel.service;

import com.campaignloyalty.hotel.entity.Hotel;
import com.campaignloyalty.hotel.repository.HotelRepository;
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
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@AllArgsConstructor
@Slf4j
public class HotelService {

    private final HotelRepository hotelRepository;
    private final DataFormatter dataFormatter = new DataFormatter();

    public Hotel findById(Integer id) {
        log.debug("Finding hotel by id={}", id);
        Hotel hotel = hotelRepository.findById(id).orElse(null);
        if (hotel == null) {
            log.warn("Hotel not found id={}", id);
        }
        return hotel;
    }

    public Hotel create(Hotel hotel) {
        log.info("Creating hotel name={} location={}", hotel.getName(), hotel.getLocation());
        if (hotelRepository.findByNameIgnoreCase(hotel.getName()) != null) {
            log.warn("Hotel creation rejected duplicateName={}", hotel.getName());
            throw new IllegalArgumentException("Hotel name already exists");
        }
        Hotel savedHotel = hotelRepository.save(hotel);
        log.info("Hotel created id={} name={}", savedHotel.getId(), savedHotel.getName());
        return savedHotel;
    }

    public Hotel authenticate(String name, String password) {
        log.info("Hotel authentication attempt name={}", name);
        Hotel hotel = hotelRepository.findByNameIgnoreCase(name);
        if (hotel == null || !hotel.getPassword().equals(password)) {
            log.warn("Hotel authentication rejected name={}", name);
            throw new IllegalArgumentException("Invalid hotel name or password");
        }
        log.info("Hotel authentication success hotelId={} name={}", hotel.getId(), hotel.getName());
        return hotel;
    }

    public List<Hotel> findAll() {
        log.debug("Loading all hotels");
        return hotelRepository.findAll();
    }

    public com.campaignloyalty.common.dto.ImportResultDto importHotelsFromExcel(MultipartFile file) {
        validateImportFile(file);
        log.info("Starting hotel Excel import filename={}", file.getOriginalFilename());

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
            requireHeaders(headers, "name", "password");

            for (int rowIndex = sheet.getFirstRowNum() + 1; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                if (row == null || isBlankRow(row)) {
                    continue;
                }

                processedCount++;
                try {
                    String name = requireValue(readCell(row, headers, "name"), "name is required");
                    String password = requireValue(readCell(row, headers, "password"), "password is required");
                    String location = normalizeOptional(readCell(row, headers, "location"));

                    Hotel hotel = hotelRepository.findByNameIgnoreCase(name);
                    boolean existingHotel = hotel != null;
                    if (hotel == null) {
                        hotel = new Hotel();
                    }

                    hotel.setName(name);
                    hotel.setPassword(password);
                    hotel.setLocation(location);
                    hotelRepository.save(hotel);

                    if (existingHotel) {
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

        log.info("Completed hotel import processed={} created={} updated={} skipped={}",
                processedCount, createdCount, updatedCount, skippedCount);
        return new com.campaignloyalty.common.dto.ImportResultDto(
                processedCount,
                createdCount,
                updatedCount,
                skippedCount,
                errors);
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
