package com.campaignloyalty.customer.service;

import com.campaignloyalty.customer.entity.Customer;
import com.campaignloyalty.customer.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    public Customer findOrCreateByDeviceId(String deviceId) {
        Customer customer = customerRepository.findByDeviceId(deviceId);
        if (customer == null) {
            customer = new Customer();
            customer.setDeviceId(deviceId);
            customer.setCreatedAt(LocalDateTime.now());
            customer = customerRepository.save(customer);
        }
        return customer;
    }
}