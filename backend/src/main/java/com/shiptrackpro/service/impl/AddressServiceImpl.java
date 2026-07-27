package com.shiptrackpro.service.impl;

import com.shiptrackpro.dto.AddressResponse;
import com.shiptrackpro.entity.Address;
import com.shiptrackpro.exception.ResourceNotFoundException;
import com.shiptrackpro.repository.AddressRepository;
import com.shiptrackpro.service.AddressService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class AddressServiceImpl implements AddressService {

    private final AddressRepository addressRepository;

    public AddressServiceImpl(AddressRepository addressRepository) {
        this.addressRepository = addressRepository;
    }

    @Override
    public List<AddressResponse> getAllAddresses() {
        return addressRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public AddressResponse getAddressById(Long id) {

        Address address = addressRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Address not found with id: " + id));

        return mapToResponse(address);
    }

    private AddressResponse mapToResponse(Address address) {

        return AddressResponse.builder()
                .id(address.getAddressId())
                .addressType(address.getAddressType())
                .line1(address.getAddressLine1())
                .line2(address.getAddressLine2())
                .landmark(address.getLandmark())
                .city(address.getCity())
                .state(address.getState())
                .postalCode(address.getPostalCode())
                .country(address.getCountry())
                .build();
    }
}