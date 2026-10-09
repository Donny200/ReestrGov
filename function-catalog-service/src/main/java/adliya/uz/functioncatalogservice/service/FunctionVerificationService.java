package adliya.uz.functioncatalogservice.service;

import adliya.uz.functioncatalogservice.entity.AuditAction;
import adliya.uz.functioncatalogservice.entity.OrgFunction;
import adliya.uz.functioncatalogservice.exception.WorkflowConflictException;
import adliya.uz.functioncatalogservice.repository.OrgFunctionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class FunctionVerificationService {

    private final OrgFunctionService functions;
    private final OrgFunctionRepository repository;
    private final AuditWriter audit;

    @Transactional
    public OrgFunction verify(Long id) {
        OrgFunction function = functions.getForAdmin(id);
        if (!StringUtils.hasText(function.getOfficialSourceUrl())) {
            throw new WorkflowConflictException("Add the official source link before verifying this service");
        }
        AuditWriter.Actor actor = audit.actor();
        function.setLastVerifiedAt(Instant.now());
        function.setVerifiedByUserId(actor.id());
        function.setVerificationOutdated(false);
        repository.saveAndFlush(function);
        audit.function(function, AuditAction.VERIFY, "Verified against " + function.getOfficialSourceUrl());
        return function;
    }
}
