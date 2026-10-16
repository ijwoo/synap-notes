package com.synap.auth;

import com.synap.note.NoteRepository;
import com.synap.note.dto.NoteSummary;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class ProfileController {

    private final UserRepository users;
    private final NoteRepository notes;

    public ProfileController(UserRepository users, NoteRepository notes) {
        this.users = users;
        this.notes = notes;
    }

    /** 공개 프로필: 이름 + 공개 노트만. (private/space 노트는 절대 노출 안 함) */
    @GetMapping("/{id}")
    public ProfileDto profile(@PathVariable long id) {
        User user = users.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자가 없어요."));
        List<NoteSummary> publicNotes = notes.findByUserIdAndVisibilityOrderByUpdatedAtDesc(id, "public")
                .stream().map(NoteSummary::from).toList();
        return new ProfileDto(user.getId(), user.getDisplayName(), publicNotes.size(), publicNotes);
    }

    public record ProfileDto(Long id, String displayName, int publicNoteCount, List<NoteSummary> notes) {
    }
}
