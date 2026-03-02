package com.substring.chat.entities;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Document(collection = "nexchat_history")
public class NexchatConversation {

    @Id
    private String id;

    private String username;  // unique key per user

    private List<ChatMessage> messages = new ArrayList<>();

    @Data
    public static class ChatMessage {
        private String role;    // "user" or "assistant"
        private String content;
        private LocalDateTime timestamp;
    }
}