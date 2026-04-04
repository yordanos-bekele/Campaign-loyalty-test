package com.campaignloyalty.hotel.controller;

import com.campaignloyalty.hotel.dto.CreateHotelRequest;
import com.campaignloyalty.hotel.entity.Hotel;
import com.campaignloyalty.hotel.service.HotelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hotels")
@AllArgsConstructor
@Tag(name = "Hotels", description = "Hotel management endpoints")
public class HotelController {

    private final HotelService hotelService;

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

    // Add other CRUD operations if needed
}
