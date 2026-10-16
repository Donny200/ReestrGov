package adliya.uz.functioncatalogservice.repository;

import adliya.uz.functioncatalogservice.entity.HelpMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface HelpMessageRepository extends JpaRepository<HelpMessage, Long> {
    List<HelpMessage> findAllByConversationIdOrderByCreatedAtAscIdAsc(Long conversationId);

    long countByConversationId(Long conversationId);

    @Query("select m.conversationId, count(m) from HelpMessage m where m.conversationId in :ids group by m.conversationId")
    List<Object[]> countByConversationIds(Collection<Long> ids);
}
