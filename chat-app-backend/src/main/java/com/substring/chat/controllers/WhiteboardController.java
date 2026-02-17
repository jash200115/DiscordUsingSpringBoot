package com.substring.chat.controllers;
import com.substring.chat.entities.WhiteboardEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class WhiteboardController {

    @MessageMapping("/whiteboard/{roomId}")
    @SendTo("/topic/whiteboard/{roomId}")
    public WhiteboardEvent handleWhiteboardEvent(
            @DestinationVariable String roomId,
            @Payload WhiteboardEvent event
    ) {

        // Ensure roomId consistency
        event.setRoomId(roomId);

        return event;
    }
}

