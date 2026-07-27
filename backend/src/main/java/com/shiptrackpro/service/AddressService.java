package com.shiptrackpro.service;

import com.shiptrackpro.dto.AddressResponse;

import java.util.List;

public interface AddressService {

    List<AddressResponse> getAllAddresses();

    AddressResponse getAddressById(Long id);
}