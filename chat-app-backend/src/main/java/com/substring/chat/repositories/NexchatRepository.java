package com.substring.chat.repositories;

import com.substring.chat.entities.User;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface NexchatRepository extends MongoRepository<User, String> {

}
