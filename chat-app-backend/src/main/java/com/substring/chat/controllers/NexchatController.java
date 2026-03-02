package com.substring.chat.controllers;

import com.substring.chat.playload.NextchatRequest;
import com.substring.chat.services.NexchatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/nexchat")
@RequiredArgsConstructor
public class NexchatController {

    private final NexchatService nexchatService;

    @PostMapping("/ask")
    public ResponseEntity<?> ask(@RequestBody NextchatRequest request) {
        try {
            String response = nexchatService.chat(
                    request.getUsername(),
                    request.getQuestion()
            );
            return ResponseEntity.ok(Map.of(
                    "username", request.getUsername(),
                    "answer", response
            ));
        } catch (Exception e) {
            // Log it and return a user-friendly error
            System.err.println("NexChat AI error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "AI service is currently unavailable. Please try again later."));
        }
    }

    @DeleteMapping("/history/{username}")
    public ResponseEntity<?> clearHistory(@PathVariable String username) {
        nexchatService.clearHistory(username);
        return ResponseEntity.ok(Map.of("message", "History cleared for " + username));
    }
}