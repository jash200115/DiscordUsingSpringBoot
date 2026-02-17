package com.substring.chat.config;

import java.util.Arrays;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    // Read from env / application.properties; default is local dev port
    @Value("${FRONTEND_URL:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        // /topic/messages
        config.setApplicationDestinationPrefixes("/app");
        // /app/chat
        // server-side: @MessageMapping("/chat")
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Accept comma-separated list in FRONTEND_URL env var
        String[] origins = Arrays.stream(frontendUrl.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toArray(String[]::new);

        // If any origin contains a wildcard, use allowed origin patterns
        boolean hasWildcard = Arrays.stream(origins).anyMatch(o -> o.contains("*"));

        if (hasWildcard) {
            registry.addEndpoint("/chat")
                    .setAllowedOriginPatterns(origins)
                    .withSockJS();
        } else {
            registry.addEndpoint("/chat")
                    .setAllowedOrigins(origins)
                    .withSockJS();
        }
    }
}
