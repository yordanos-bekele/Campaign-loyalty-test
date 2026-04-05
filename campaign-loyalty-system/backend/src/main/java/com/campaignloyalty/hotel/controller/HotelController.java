package com.campaignloyalty.hotel.controller;

import com.campaignloyalty.hotel.dto.CreateHotelRequest;
import com.campaignloyalty.hotel.entity.Hotel;
import com.campaignloyalty.hotel.service.HotelService;
import com.campaignloyalty.auth.service.AuthService;
import com.campaignloyalty.common.dto.ImportResultDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hotels")
@AllArgsConstructor
@Tag(name = "Hotels", description = "Hotel management endpoints")
public class HotelController {

    private final HotelService hotelService;
    private final AuthService authService;

    @PostMapping
    @Operation(
            summary = "Create a hotel",
            description = "Creates a hotel record so QR tokens can be generated for it.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Hotel created"),
                    @ApiResponse(responseCode = "400", description = "Invalid hotel payload", content = @Content(schema = @Schema(implementation = String.class)))
            }
    )
    public ResponseEntity<Hotel> createHotel(@Valid @RequestBody CreateHotelRequest request) {
        Hotel hotel = new Hotel();
        hotel.setName(request.getName());
        hotel.setLocation(request.getLocation());
        hotel.setPassword(request.getPassword());
        return ResponseEntity.ok(hotelService.create(hotel));
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Get a hotel by id",
            description = "Returns a single hotel if it exists.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Hotel found"),
                    @ApiResponse(responseCode = "404", description = "Hotel not found")
            }
    )
    public ResponseEntity<Hotel> getHotel(@PathVariable Integer id) {
        Hotel hotel = hotelService.findById(id);
        if (hotel == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(hotel);
    }

    @PostMapping("/import")
    @Operation(
            summary = "Import hotels from Excel",
            description = "Creates or updates hotels from the first worksheet in an uploaded Excel file.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Hotel import completed"),
                    @ApiResponse(responseCode = "400", description = "Invalid file or import data", content = @Content(schema = @Schema(implementation = String.class)))
            }
    )
    public ResponseEntity<ImportResultDto> importHotels(
            @RequestParam("file") MultipartFile file,
            HttpSession session) {
        authService.requireAdmin(session);
        return ResponseEntity.ok(hotelService.importHotelsFromExcel(file));
    }
}
