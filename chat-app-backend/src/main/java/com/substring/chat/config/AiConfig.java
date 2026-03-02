package com.substring.chat.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiConfig {

    /**
     * Spring AI auto-configures a ChatClient.Builder bean when the
     * spring-ai-openai-spring-boot-starter is on the classpath.
     *
     * We use that builder here to create the actual ChatClient bean
     * that gets injected into NexchatService.
     *
     * INTERVIEW Q: "What is the Builder pattern and why does Spring AI use it?"
     * A: The Builder pattern lets you construct a complex object step-by-step,
     *    configuring it before finalizing. Spring AI uses it because ChatClient
     *    can have optional configs (default system prompt, advisors, etc.).
     *    Injecting the Builder instead of the final object gives you flexibility
     *    to create multiple differently-configured ChatClient instances if needed.
     *
     * INTERVIEW Q: "What is a Spring @Bean and why define one manually?"
     * A: @Bean tells Spring to call this method once at startup and register
     *    the returned object in the Application Context (IoC container).
     *    We define it manually here because ChatClient is NOT a @Component —
     *    it's a framework interface. We need to explicitly wire it up.
     *    This is the "Java-based configuration" approach vs @Component scanning.
     */
    @Bean
    public ChatClient chatClient(ChatClient.Builder builder) {
        return builder
                .defaultSystem("""
                        You are NexChat AI, a helpful, friendly, and concise assistant
                        built into the NexChat messaging platform.
                        Always respond clearly and helpfully.
                        """)
                .build();
    }
}