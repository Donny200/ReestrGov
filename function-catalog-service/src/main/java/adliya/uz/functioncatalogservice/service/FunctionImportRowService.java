package adliya.uz.functioncatalogservice.service;

import adliya.uz.functioncatalogservice.dto.CreateOrgFunctionRequest;
import adliya.uz.functioncatalogservice.repository.OrgFunctionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

@Service @RequiredArgsConstructor
public class FunctionImportRowService {
    private final OrgFunctionService functions;
    private final OrgFunctionRepository repository;
    private final AuditWriter audit;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Long persist(CreateOrgFunctionRequest request, Long batchId) {
        var function = functions.newDraft(request);
        repository.saveAndFlush(function);
        audit.addImported(batchId, function.getId());
        return function.getId();
    }
}
