/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ResearchController } from './../controllers/research.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ResearchResultController } from './../controllers/research-result.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { HealthController } from './../controllers/master.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { CrawlerController } from './../controllers/crawler.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { CompanyController } from './../controllers/company.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AIResearchController } from './../controllers/ai-research.controller';
import { expressAuthentication } from './../auth/authentication';
// @ts-ignore - no great way to install types from subpackage
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';

const expressAuthenticationRecasted = expressAuthentication as (req: ExRequest, securityName: string, scopes?: string[], res?: ExResponse) => Promise<any>;


// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "ResearchResponseDTO": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"double","required":true},
            "company_id": {"dataType":"double","required":true},
            "research_status": {"dataType":"string","required":true},
            "company": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"website_url":{"dataType":"string","required":true},"company_name":{"dataType":"string","required":true},"id":{"dataType":"double","required":true}}},{"dataType":"enum","enums":[null]}]},
            "started_at": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},
            "completed_at": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},
            "error_message": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "active": {"dataType":"boolean","required":true},
            "created": {"dataType":"datetime","required":true},
            "created_by": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "modified": {"dataType":"datetime","required":true},
            "modified_by": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResearchSingleResponseDTO": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"ref":"ResearchResponseDTO"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateResearchDTO": {
        "dataType": "refObject",
        "properties": {
            "company_id": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResearchListResponseDTO": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"ResearchResponseDTO"},"required":true},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"totalPages":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true},"total":{"dataType":"double","required":true}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResearchDeleteResponseDTO": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CompanySummaryDTO": {
        "dataType": "refObject",
        "properties": {
            "description": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "industry": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "business_model": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CompanyLocationDTO": {
        "dataType": "refObject",
        "properties": {
            "location_type": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "address": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "city": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "state": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "country": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SocialMediaLinksDTO": {
        "dataType": "refObject",
        "properties": {
            "linkedin": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "instagram": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "facebook": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "x": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "youtube": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ContactDetailsDTO": {
        "dataType": "refObject",
        "properties": {
            "email": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "phone": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "contact_page_url": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TotalWorkingMembersDTO": {
        "dataType": "refObject",
        "properties": {
            "employee_count": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "employee_range": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "is_estimate": {"dataType":"boolean","required":true},
            "as_of_date": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProductServiceDTO": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["product"]},{"dataType":"enum","enums":["service"]},{"dataType":"enum","enums":["both"]},{"dataType":"enum","enums":["unknown"]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResearchResultResponseDTO": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"double","required":true},
            "research_id": {"dataType":"double","required":true},
            "company_summary": {"dataType":"union","subSchemas":[{"ref":"CompanySummaryDTO"},{"dataType":"enum","enums":[null]}],"required":true},
            "company_locations": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"CompanyLocationDTO"}},{"dataType":"enum","enums":[null]}],"required":true},
            "social_media_links": {"dataType":"union","subSchemas":[{"ref":"SocialMediaLinksDTO"},{"dataType":"enum","enums":[null]}],"required":true},
            "contact_details": {"dataType":"union","subSchemas":[{"ref":"ContactDetailsDTO"},{"dataType":"enum","enums":[null]}],"required":true},
            "total_working_members": {"dataType":"union","subSchemas":[{"ref":"TotalWorkingMembersDTO"},{"dataType":"enum","enums":[null]}],"required":true},
            "career_page_url": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "products_services": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"ProductServiceDTO"}},{"dataType":"enum","enums":[null]}],"required":true},
            "created": {"dataType":"datetime","required":true},
            "modified": {"dataType":"datetime","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateResearchResultDTO": {
        "dataType": "refObject",
        "properties": {
            "research_id": {"dataType":"double","required":true},
            "company_summary": {"dataType":"union","subSchemas":[{"ref":"CompanySummaryDTO"},{"dataType":"enum","enums":[null]}]},
            "company_locations": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"CompanyLocationDTO"}},{"dataType":"enum","enums":[null]}]},
            "social_media_links": {"dataType":"union","subSchemas":[{"ref":"SocialMediaLinksDTO"},{"dataType":"enum","enums":[null]}]},
            "contact_details": {"dataType":"union","subSchemas":[{"ref":"ContactDetailsDTO"},{"dataType":"enum","enums":[null]}]},
            "total_working_members": {"dataType":"union","subSchemas":[{"ref":"TotalWorkingMembersDTO"},{"dataType":"enum","enums":[null]}]},
            "career_page_url": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "products_services": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"ProductServiceDTO"}},{"dataType":"enum","enums":[null]}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResearchResultEvidenceResponseDTO": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"double","required":true},
            "research_id": {"dataType":"double","required":true},
            "result_id": {"dataType":"double","required":true},
            "field_name": {"dataType":"string","required":true},
            "source_url": {"dataType":"string","required":true},
            "source_title": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "evidence_text": {"dataType":"string","required":true},
            "confidence": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "created": {"dataType":"datetime","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CrawledSourceDTO": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"double","required":true},
            "research_id": {"dataType":"double","required":true},
            "company_id": {"dataType":"double","required":true},
            "page_url": {"dataType":"string","required":true},
            "page_title": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "page_type": {"dataType":"string","required":true},
            "meta_description": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "extracted_text": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "crawl_status": {"dataType":"string","required":true},
            "http_status": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CrawlPageResponseDTO": {
        "dataType": "refObject",
        "properties": {
            "message": {"dataType":"string","required":true},
            "source": {"dataType":"union","subSchemas":[{"ref":"CrawledSourceDTO"},{"dataType":"enum","enums":[null]}],"required":true},
            "discovered_links": {"dataType":"array","array":{"dataType":"string"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CrawlPageDTO": {
        "dataType": "refObject",
        "properties": {
            "page_url": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MultiPageCrawlResponseDTO": {
        "dataType": "refObject",
        "properties": {
            "message": {"dataType":"string","required":true},
            "research_id": {"dataType":"double","required":true},
            "total_pages_attempted": {"dataType":"double","required":true},
            "successful_pages": {"dataType":"double","required":true},
            "failed_pages": {"dataType":"double","required":true},
            "skipped_pages": {"dataType":"double","required":true},
            "sources": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"http_status":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},"crawl_status":{"dataType":"string","required":true},"page_type":{"dataType":"string","required":true},"page_title":{"dataType":"string","required":true},"page_url":{"dataType":"string","required":true},"id":{"dataType":"double","required":true}}},"required":true},
            "failures": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"error":{"dataType":"string","required":true},"page_url":{"dataType":"string","required":true}}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CompanyResponseDTO": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"double","required":true},
            "company_name": {"dataType":"string","required":true},
            "website_url": {"dataType":"string","required":true},
            "industry": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "description": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "headquarters": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "research_status": {"dataType":"string","required":true},
            "active": {"dataType":"boolean","required":true},
            "created": {"dataType":"datetime","required":true},
            "created_by": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "modified": {"dataType":"datetime","required":true},
            "modified_by": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CompanySingleResponseDTO": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"ref":"CompanyResponseDTO","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateCompanyDTO": {
        "dataType": "refObject",
        "properties": {
            "company_name": {"dataType":"string","required":true},
            "website_url": {"dataType":"string","required":true},
            "industry": {"dataType":"string"},
            "description": {"dataType":"string"},
            "headquarters": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CompanyListResponseDTO": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"CompanyResponseDTO"},"required":true},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"totalPages":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true},"total":{"dataType":"double","required":true}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateCompanyDTO": {
        "dataType": "refObject",
        "properties": {
            "company_name": {"dataType":"string"},
            "website_url": {"dataType":"string"},
            "industry": {"dataType":"string"},
            "description": {"dataType":"string"},
            "headquarters": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CompanyDeleteResponseDTO": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AIResearchResponseDTO": {
        "dataType": "refObject",
        "properties": {
            "message": {"dataType":"string","required":true},
            "research_result": {"ref":"ResearchResultResponseDTO","required":true},
            "evidences": {"dataType":"array","array":{"dataType":"refObject","ref":"ResearchResultEvidenceResponseDTO"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AIResearchErrorDTO": {
        "dataType": "refObject",
        "properties": {
            "message": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"throw-on-extras","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################


    
        const argsResearchController_createResearch: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreateResearchDTO"},
        };
        app.post('/api/v1/research',
            ...(fetchMiddlewares<RequestHandler>(ResearchController)),
            ...(fetchMiddlewares<RequestHandler>(ResearchController.prototype.createResearch)),

            async function ResearchController_createResearch(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsResearchController_createResearch, request, response });

                const controller = new ResearchController();

              await templateService.apiHandler({
                methodName: 'createResearch',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsResearchController_getAllResearch: Record<string, TsoaRoute.ParameterSchema> = {
                page: {"default":1,"in":"query","name":"page","dataType":"double"},
                limit: {"default":10,"in":"query","name":"limit","dataType":"double"},
                company_id: {"in":"query","name":"company_id","dataType":"double"},
        };
        app.get('/api/v1/research',
            ...(fetchMiddlewares<RequestHandler>(ResearchController)),
            ...(fetchMiddlewares<RequestHandler>(ResearchController.prototype.getAllResearch)),

            async function ResearchController_getAllResearch(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsResearchController_getAllResearch, request, response });

                const controller = new ResearchController();

              await templateService.apiHandler({
                methodName: 'getAllResearch',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsResearchController_getResearchById: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
        };
        app.get('/api/v1/research/:id',
            ...(fetchMiddlewares<RequestHandler>(ResearchController)),
            ...(fetchMiddlewares<RequestHandler>(ResearchController.prototype.getResearchById)),

            async function ResearchController_getResearchById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsResearchController_getResearchById, request, response });

                const controller = new ResearchController();

              await templateService.apiHandler({
                methodName: 'getResearchById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsResearchController_getResearchByCompanyId: Record<string, TsoaRoute.ParameterSchema> = {
                companyId: {"in":"path","name":"companyId","required":true,"dataType":"double"},
                page: {"default":1,"in":"query","name":"page","dataType":"double"},
                limit: {"default":10,"in":"query","name":"limit","dataType":"double"},
        };
        app.get('/api/v1/research/company/:companyId',
            ...(fetchMiddlewares<RequestHandler>(ResearchController)),
            ...(fetchMiddlewares<RequestHandler>(ResearchController.prototype.getResearchByCompanyId)),

            async function ResearchController_getResearchByCompanyId(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsResearchController_getResearchByCompanyId, request, response });

                const controller = new ResearchController();

              await templateService.apiHandler({
                methodName: 'getResearchByCompanyId',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsResearchController_deleteResearch: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
        };
        app.delete('/api/v1/research/:id',
            ...(fetchMiddlewares<RequestHandler>(ResearchController)),
            ...(fetchMiddlewares<RequestHandler>(ResearchController.prototype.deleteResearch)),

            async function ResearchController_deleteResearch(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsResearchController_deleteResearch, request, response });

                const controller = new ResearchController();

              await templateService.apiHandler({
                methodName: 'deleteResearch',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsResearchResultController_createResearchResult: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreateResearchResultDTO"},
        };
        app.post('/api/v1/research-results',
            ...(fetchMiddlewares<RequestHandler>(ResearchResultController)),
            ...(fetchMiddlewares<RequestHandler>(ResearchResultController.prototype.createResearchResult)),

            async function ResearchResultController_createResearchResult(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsResearchResultController_createResearchResult, request, response });

                const controller = new ResearchResultController();

              await templateService.apiHandler({
                methodName: 'createResearchResult',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsResearchResultController_getResearchResult: Record<string, TsoaRoute.ParameterSchema> = {
                researchId: {"in":"path","name":"researchId","required":true,"dataType":"double"},
        };
        app.get('/api/v1/research-results/:researchId',
            ...(fetchMiddlewares<RequestHandler>(ResearchResultController)),
            ...(fetchMiddlewares<RequestHandler>(ResearchResultController.prototype.getResearchResult)),

            async function ResearchResultController_getResearchResult(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsResearchResultController_getResearchResult, request, response });

                const controller = new ResearchResultController();

              await templateService.apiHandler({
                methodName: 'getResearchResult',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsResearchResultController_getResearchResultEvidence: Record<string, TsoaRoute.ParameterSchema> = {
                researchId: {"in":"path","name":"researchId","required":true,"dataType":"double"},
        };
        app.get('/api/v1/research-results/:researchId/evidences',
            ...(fetchMiddlewares<RequestHandler>(ResearchResultController)),
            ...(fetchMiddlewares<RequestHandler>(ResearchResultController.prototype.getResearchResultEvidence)),

            async function ResearchResultController_getResearchResultEvidence(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsResearchResultController_getResearchResultEvidence, request, response });

                const controller = new ResearchResultController();

              await templateService.apiHandler({
                methodName: 'getResearchResultEvidence',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsHealthController_checkHealth: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/api/v1/health',
            ...(fetchMiddlewares<RequestHandler>(HealthController)),
            ...(fetchMiddlewares<RequestHandler>(HealthController.prototype.checkHealth)),

            async function HealthController_checkHealth(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsHealthController_checkHealth, request, response });

                const controller = new HealthController();

              await templateService.apiHandler({
                methodName: 'checkHealth',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCrawlerController_crawlResearchPage: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CrawlPageDTO"},
        };
        app.post('/api/v1/research/:id/crawl',
            ...(fetchMiddlewares<RequestHandler>(CrawlerController)),
            ...(fetchMiddlewares<RequestHandler>(CrawlerController.prototype.crawlResearchPage)),

            async function CrawlerController_crawlResearchPage(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCrawlerController_crawlResearchPage, request, response });

                const controller = new CrawlerController();

              await templateService.apiHandler({
                methodName: 'crawlResearchPage',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCrawlerController_crawlMultiplePages: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
        };
        app.post('/api/v1/research/:id/crawl-all',
            ...(fetchMiddlewares<RequestHandler>(CrawlerController)),
            ...(fetchMiddlewares<RequestHandler>(CrawlerController.prototype.crawlMultiplePages)),

            async function CrawlerController_crawlMultiplePages(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCrawlerController_crawlMultiplePages, request, response });

                const controller = new CrawlerController();

              await templateService.apiHandler({
                methodName: 'crawlMultiplePages',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCompanyController_createCompany: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreateCompanyDTO"},
        };
        app.post('/api/v1/companies',
            ...(fetchMiddlewares<RequestHandler>(CompanyController)),
            ...(fetchMiddlewares<RequestHandler>(CompanyController.prototype.createCompany)),

            async function CompanyController_createCompany(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCompanyController_createCompany, request, response });

                const controller = new CompanyController();

              await templateService.apiHandler({
                methodName: 'createCompany',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCompanyController_getAllCompanies: Record<string, TsoaRoute.ParameterSchema> = {
                page: {"default":1,"in":"query","name":"page","dataType":"double"},
                limit: {"default":10,"in":"query","name":"limit","dataType":"double"},
                search: {"in":"query","name":"search","dataType":"string"},
        };
        app.get('/api/v1/companies',
            ...(fetchMiddlewares<RequestHandler>(CompanyController)),
            ...(fetchMiddlewares<RequestHandler>(CompanyController.prototype.getAllCompanies)),

            async function CompanyController_getAllCompanies(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCompanyController_getAllCompanies, request, response });

                const controller = new CompanyController();

              await templateService.apiHandler({
                methodName: 'getAllCompanies',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCompanyController_getCompanyById: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
        };
        app.get('/api/v1/companies/:id',
            ...(fetchMiddlewares<RequestHandler>(CompanyController)),
            ...(fetchMiddlewares<RequestHandler>(CompanyController.prototype.getCompanyById)),

            async function CompanyController_getCompanyById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCompanyController_getCompanyById, request, response });

                const controller = new CompanyController();

              await templateService.apiHandler({
                methodName: 'getCompanyById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCompanyController_updateCompany: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateCompanyDTO"},
        };
        app.put('/api/v1/companies/:id',
            ...(fetchMiddlewares<RequestHandler>(CompanyController)),
            ...(fetchMiddlewares<RequestHandler>(CompanyController.prototype.updateCompany)),

            async function CompanyController_updateCompany(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCompanyController_updateCompany, request, response });

                const controller = new CompanyController();

              await templateService.apiHandler({
                methodName: 'updateCompany',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCompanyController_deleteCompany: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
        };
        app.delete('/api/v1/companies/:id',
            ...(fetchMiddlewares<RequestHandler>(CompanyController)),
            ...(fetchMiddlewares<RequestHandler>(CompanyController.prototype.deleteCompany)),

            async function CompanyController_deleteCompany(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCompanyController_deleteCompany, request, response });

                const controller = new CompanyController();

              await templateService.apiHandler({
                methodName: 'deleteCompany',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAIResearchController_analyzeCompanyResearch: Record<string, TsoaRoute.ParameterSchema> = {
                researchId: {"in":"path","name":"researchId","required":true,"dataType":"double"},
        };
        app.post('/api/v1/research/:researchId/analyze',
            ...(fetchMiddlewares<RequestHandler>(AIResearchController)),
            ...(fetchMiddlewares<RequestHandler>(AIResearchController.prototype.analyzeCompanyResearch)),

            async function AIResearchController_analyzeCompanyResearch(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAIResearchController_analyzeCompanyResearch, request, response });

                const controller = new AIResearchController();

              await templateService.apiHandler({
                methodName: 'analyzeCompanyResearch',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
