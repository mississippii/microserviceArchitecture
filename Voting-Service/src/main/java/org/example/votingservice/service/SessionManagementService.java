package org.example.votingservice.service;

import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class SessionManagementService {
    private final ConcurrentHashMap<String, HttpSession> activeSessions = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

    public SessionManagementService() {
    }
}
