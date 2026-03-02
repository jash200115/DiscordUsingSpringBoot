package com.substring.chat.services;

import com.substring.chat.entities.NexchatConversation;
import com.substring.chat.entities.NexchatConversation.ChatMessage;
import com.substring.chat.repositories.NexchatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NexchatService {

    private final ChatClient chatClient;
    private final NexchatRepository nexchatRepository;

    public String chat(String username, String question) {

        // 1. Fetch or create conversation history for this user
        NexchatConversation conversation = nexchatRepository
                .findByUsername(username)
                .orElseGet(() -> {
                    NexchatConversation newConv = new NexchatConversation();
                    newConv.setUsername(username);
                    return newConv;
                });

        // 2. Build prompt with history context
        String history = conversation.getMessages().stream()
                .map(m -> m.getRole().toUpperCase() + ": " + m.getContent())
                .collect(Collectors.joining("\n"));

        String fullPrompt = history.isBlank()
                ? question
                : history + "\nUSER: " + question;

        // 3. Call Spring AI
        String aiResponse = chatClient.prompt()
                .user(fullPrompt)
                .call()
                .content();

        // 4. Save user message to history
        ChatMessage userMsg = new ChatMessage();
        userMsg.setRole("user");
        userMsg.setContent(question);
        userMsg.setTimestamp(LocalDateTime.now());
        conversation.getMessages().add(userMsg);

        // 5. Save AI response to history
        ChatMessage assistantMsg = new ChatMessage();
        assistantMsg.setRole("assistant");
        assistantMsg.setContent(aiResponse);
        assistantMsg.setTimestamp(LocalDateTime.now());
        conversation.getMessages().add(assistantMsg);

        // 6. Persist to MongoDB
        nexchatRepository.save(conversation);

        return aiResponse;
    }

    // Utility to clear history if needed
    public void clearHistory(String username) {
        nexchatRepository.findByUsername(username)
                .ifPresent(conv -> {
                    conv.getMessages().clear();
                    nexchatRepository.save(conv);
                });
    }
}