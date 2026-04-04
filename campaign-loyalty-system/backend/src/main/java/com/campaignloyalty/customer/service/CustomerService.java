package com.campaignloyalty.customer.service;

import com.campaignloyalty.customer.entity.Customer;
import com.campaignloyalty.customer.repository.CustomerRepository;

import lombok.AllArgsConstructor;

import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;

    public Customer findOrCreateByDeviceId(String deviceId) {
        Customer customer = customerRepository.findByDeviceId(deviceId);
        if (customer == null) {
            customer = new Customer();
            customer.setDeviceId(deviceId);
            customer = customerRepository.save(customer);
        }
        return customer;
    }
}
