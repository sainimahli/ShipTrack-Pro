package com.shiptrackpro.dto;

import com.shiptrackpro.enums.AddressType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Outbound address payload returned by the Address API.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressResponse {

    private Long id;

    private AddressType addressType;

    private String line1;

    private String line2;

    private String landmark;

    private String city;

    private String state;

    private String postalCode;

    private String country;
}