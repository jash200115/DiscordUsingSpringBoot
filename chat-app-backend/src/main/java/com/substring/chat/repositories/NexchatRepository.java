package com.substring.chat.repositories;

import com.substring.chat.entities.NexchatConversation;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface NexchatRepository extends MongoRepository<NexchatConversation, String> {

    // Spring Data auto-generates the query from method name
    Optional<NexchatConversation> findByUsername(String username);
}