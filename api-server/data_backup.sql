----

-- PostgreSQL database dump-- PostgreSQL database dump

----



\restrict tUZmTBULYf0XgG81bjBznHgpeO9WkwWmx6e8ipunJE8cFqauY2m1I7ZJnaOpAiQ\restrict tUZmTBULYf0XgG81bjBznHgpeO9WkwWmx6e8ipunJE8cFqauY2m1I7ZJnaOpAiQ



-- Dumped from database version 15.14 (Debian 15.14-1.pgdg12+1)-- Dumped from database version 15.14 (Debian 15.14-1.pgdg12+1)

-- Dumped by pg_dump version 15.14 (Debian 15.14-1.pgdg12+1)-- Dumped by pg_dump version 15.14 (Debian 15.14-1.pgdg12+1)



SET statement_timeout = 0;SET statement_timeout = 0;

SET lock_timeout = 0;SET lock_timeout = 0;

SET idle_in_transaction_session_timeout = 0;SET idle_in_transaction_session_timeout = 0;

SET client_encoding = 'UTF8';SET client_encoding = 'UTF8';

SET standard_conforming_strings = on;SET standard_conforming_strings = on;

SELECT pg_catalog.set_config('search_path', '', false);SELECT pg_catalog.set_config('search_path', '', false);

SET check_function_bodies = false;SET check_function_bodies = false;

SET xmloption = content;SET xmloption = content;

SET client_min_messages = warning;SET client_min_messages = warning;

SET row_security = off;SET row_security = off;



----

-- Data for Name: ai_providers_master; Type: TABLE DATA; Schema: public; Owner: postgres-- Data for Name: ai_providers_master; Type: TABLE DATA; Schema: public; Owner: postgres

----



INSERT INTO public.ai_providers_master (id, name, type, base_url, supported_models, default_settings, is_active, created_at, updated_at) VALUES ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'OpenAI', 'openai', 'https://api.openai.com', '["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"]', '{"temperature": 0.7, "max_tokens": 1000}', true, '2025-09-10 04:19:02.251392+00', '2025-09-10 04:19:02.251392+00');INSERT INTO public.ai_providers_master (id, name, type, base_url, supported_models, default_settings, is_active, created_at, updated_at) VALUES ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'OpenAI', 'openai', 'https://api.openai.com', '["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"]', '{"temperature": 0.7, "max_tokens": 1000}', true, '2025-09-10 04:19:02.251392+00', '2025-09-10 04:19:02.251392+00');





----

-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: postgres-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: postgres

----



INSERT INTO public.tenants (id, name, slug, settings, is_active, created_at, updated_at, global_rate_limit, feature_flags) VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Test Company', 'test-company', '{}', true, '2025-09-09 11:59:05.786436+00', '2025-09-09 11:59:05.786436+00', 1000, '{}');INSERT INTO public.tenants (id, name, slug, settings, is_active, created_at, updated_at, global_rate_limit, feature_flags) VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Test Company', 'test-company', '{}', true, '2025-09-09 11:59:05.786436+00', '2025-09-09 11:59:05.786436+00', 1000, '{}');





----

-- Data for Name: api_keys; Type: TABLE DATA; Schema: public; Owner: postgres-- Data for Name: api_keys; Type: TABLE DATA; Schema: public; Owner: postgres

----



INSERT INTO public.api_keys (id, tenant_id, name, key_hash, key_prefix, scopes, rate_limit, is_active, last_used_at, expires_at, created_at, updated_at) VALUES ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Test API Key', '$2b$12$KIXWJhAUhDx0x3bVo7.8Ee8JQK5vQx/YrGnW3DzLKMm1MXaFDOdO6', 'test-key', '["chat"]', 1000, true, NULL, NULL, '2025-09-09 11:59:05.786436+00', '2025-09-09 11:59:05.786436+00');INSERT INTO public.api_keys (id, tenant_id, name, key_hash, key_prefix, scopes, rate_limit, is_active, last_used_at, expires_at, created_at, updated_at) VALUES ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Test API Key', '$2b$12$KIXWJhAUhDx0x3bVo7.8Ee8JQK5vQx/YrGnW3DzLKMm1MXaFDOdO6', 'test-key', '["chat"]', 1000, true, NULL, NULL, '2025-09-09 11:59:05.786436+00', '2025-09-09 11:59:05.786436+00');

INSERT INTO public.api_keys (id, tenant_id, name, key_hash, key_prefix, scopes, rate_limit, is_active, last_used_at, expires_at, created_at, updated_at) VALUES ('aa0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Simple Test Key', 'simple-test-hash', 'test-simple', '["chat"]', 100, true, NULL, NULL, '2025-09-09 12:10:44.084186+00', '2025-09-09 12:10:44.084186+00');INSERT INTO public.api_keys (id, tenant_id, name, key_hash, key_prefix, scopes, rate_limit, is_active, last_used_at, expires_at, created_at, updated_at) VALUES ('aa0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Simple Test Key', 'simple-test-hash', 'test-simple', '["chat"]', 100, true, NULL, NULL, '2025-09-09 12:10:44.084186+00', '2025-09-09 12:10:44.084186+00');

INSERT INTO public.api_keys (id, tenant_id, name, key_hash, key_prefix, scopes, rate_limit, is_active, last_used_at, expires_at, created_at, updated_at) VALUES ('bb0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Development API Key', 'dev-key-hash', 'dev-key', '["chat", "admin"]', 1000, true, NULL, NULL, '2025-09-10 02:12:41.054262+00', '2025-09-10 02:12:41.054262+00');INSERT INTO public.api_keys (id, tenant_id, name, key_hash, key_prefix, scopes, rate_limit, is_active, last_used_at, expires_at, created_at, updated_at) VALUES ('bb0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Development API Key', 'dev-key-hash', 'dev-key', '["chat", "admin"]', 1000, true, NULL, NULL, '2025-09-10 02:12:41.054262+00', '2025-09-10 02:12:41.054262+00');





----

-- Data for Name: tenant_ai_providers; Type: TABLE DATA; Schema: public; Owner: postgres-- Data for Name: tenant_ai_providers; Type: TABLE DATA; Schema: public; Owner: postgres

----



INSERT INTO public.tenant_ai_providers (id, tenant_id, provider_name, api_key, base_url, custom_settings, is_active, created_at, updated_at, ai_provider_id) VALUES ('aa1e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'openai', 'YOUR_OPENAI_API_KEY_HERE', 'https://api.openai.com/v1', '{"organization": null, "default_model": "gpt-3.5-turbo", "max_tokens": 4000}', true, '2025-09-10 03:35:40.623051+00', '2025-09-10 03:35:40.623051+00', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');INSERT INTO public.tenant_ai_providers (id, tenant_id, provider_name, api_key, base_url, custom_settings, is_active, created_at, updated_at, ai_provider_id) VALUES ('aa1e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'openai', 'sk-proFxcubx7tzsnpXCfenkJqnAaFkg7EUlFFswtoACVhmwGM0gqG5jVeY63eefgAcuQAV1rindbpLFlW7ZsAA', 'https://api.openai.com/v1', '{"organization": null, "default_model": "gpt-3.5-turbo", "max_tokens": 4000}', true, '2025-09-10 03:35:40.623051+00', '2025-09-10 03:35:40.623051+00', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');





----

-- Data for Name: bots; Type: TABLE DATA; Schema: public; Owner: postgres-- Data for Name: bots; Type: TABLE DATA; Schema: public; Owner: postgres

----



INSERT INTO public.bots (id, tenant_id, name, description, system_prompt, model, temperature, max_tokens, is_active, settings, created_at, updated_at, is_public, allowed_domains, tenant_ai_provider_id) VALUES ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Customer Support Bot', 'A helpful customer support assistant', 'You are a helpful customer support assistant. Be polite and professional.', 'gpt-3.5-turbo', 0.7, NULL, true, '{}', '2025-09-09 11:59:05.786436+00', '2025-09-09 11:59:05.786436+00', true, '[]', 'aa1e8400-e29b-41d4-a716-446655440001');INSERT INTO public.bots (id, tenant_id, name, description, system_prompt, model, temperature, max_tokens, is_active, settings, created_at, updated_at, is_public, allowed_domains, tenant_ai_provider_id) VALUES ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Customer Support Bot', 'A helpful customer support assistant', 'You are a helpful customer support assistant. Be polite and professional.', 'gpt-3.5-turbo', 0.7, NULL, true, '{}', '2025-09-09 11:59:05.786436+00', '2025-09-09 11:59:05.786436+00', true, '[]', 'aa1e8400-e29b-41d4-a716-446655440001');





----

-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: postgres-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: postgres

----



INSERT INTO public.conversations (id, bot_id, session_id, title, metadata, is_active, created_at, updated_at, user_ip, user_agent) VALUES ('b7553c21-5a72-4aa0-b093-c37f4fe8541e', '550e8400-e29b-41d4-a716-446655440001', NULL, NULL, '{}', true, '2025-09-10 01:59:34.971389+00', '2025-09-10 01:59:34.971389+00', NULL, NULL);INSERT INTO public.conversations (id, bot_id, session_id, title, metadata, is_active, created_at, updated_at, user_ip, user_agent) VALUES ('b7553c21-5a72-4aa0-b093-c37f4fe8541e', '550e8400-e29b-41d4-a716-446655440001', NULL, NULL, '{}', true, '2025-09-10 01:59:34.971389+00', '2025-09-10 01:59:34.971389+00', NULL, NULL);

INSERT INTO public.conversations (id, bot_id, session_id, title, metadata, is_active, created_at, updated_at, user_ip, user_agent) VALUES ('f5665faf-3a65-4af9-b1cf-3dd5ab1a146d', '550e8400-e29b-41d4-a716-446655440001', NULL, NULL, '{}', true, '2025-09-10 02:02:07.373377+00', '2025-09-10 02:02:07.373377+00', NULL, NULL);INSERT INTO public.conversations (id, bot_id, session_id, title, metadata, is_active, created_at, updated_at, user_ip, user_agent) VALUES ('f5665faf-3a65-4af9-b1cf-3dd5ab1a146d', '550e8400-e29b-41d4-a716-446655440001', NULL, NULL, '{}', true, '2025-09-10 02:02:07.373377+00', '2025-09-10 02:02:07.373377+00', NULL, NULL);

INSERT INTO public.conversations (id, bot_id, session_id, title, metadata, is_active, created_at, updated_at, user_ip, user_agent) VALUES ('075862d6-0609-4f84-a27b-48cf08c756c0', '550e8400-e29b-41d4-a716-446655440001', NULL, NULL, '{}', true, '2025-09-10 02:04:05.272318+00', '2025-09-10 02:04:05.272318+00', NULL, NULL);INSERT INTO public.conversations (id, bot_id, session_id, title, metadata, is_active, created_at, updated_at, user_ip, user_agent) VALUES ('075862d6-0609-4f84-a27b-48cf08c756c0', '550e8400-e29b-41d4-a716-446655440001', NULL, NULL, '{}', true, '2025-09-10 02:04:05.272318+00', '2025-09-10 02:04:05.272318+00', NULL, NULL);

INSERT INTO public.conversations (id, bot_id, session_id, title, metadata, is_active, created_at, updated_at, user_ip, user_agent) VALUES ('bd37c33d-1e36-4835-a875-c7e9bafba72c', '550e8400-e29b-41d4-a716-446655440001', NULL, NULL, '{}', true, '2025-09-10 02:13:35.196778+00', '2025-09-10 02:13:35.196778+00', NULL, NULL);INSERT INTO public.conversations (id, bot_id, session_id, title, metadata, is_active, created_at, updated_at, user_ip, user_agent) VALUES ('bd37c33d-1e36-4835-a875-c7e9bafba72c', '550e8400-e29b-41d4-a716-446655440001', NULL, NULL, '{}', true, '2025-09-10 02:13:35.196778+00', '2025-09-10 02:13:35.196778+00', NULL, NULL);

INSERT INTO public.conversations (id, bot_id, session_id, title, metadata, is_active, created_at, updated_at, user_ip, user_agent) VALUES ('cd18c3f6-b011-4eb4-bda2-eef763352777', '550e8400-e29b-41d4-a716-446655440001', NULL, NULL, '{}', true, '2025-09-10 02:18:12.075142+00', '2025-09-10 02:18:12.075142+00', NULL, NULL);INSERT INTO public.conversations (id, bot_id, session_id, title, metadata, is_active, created_at, updated_at, user_ip, user_agent) VALUES ('cd18c3f6-b011-4eb4-bda2-eef763352777', '550e8400-e29b-41d4-a716-446655440001', NULL, NULL, '{}', true, '2025-09-10 02:18:12.075142+00', '2025-09-10 02:18:12.075142+00', NULL, NULL);

INSERT INTO public.conversations (id, bot_id, session_id, title, metadata, is_active, created_at, updated_at, user_ip, user_agent) VALUES ('f30af60e-cd0c-452e-aeb5-8bb987b22cb7', '550e8400-e29b-41d4-a716-446655440001', NULL, NULL, '{}', true, '2025-09-10 02:18:53.962578+00', '2025-09-10 02:18:53.962578+00', NULL, NULL);INSERT INTO public.conversations (id, bot_id, session_id, title, metadata, is_active, created_at, updated_at, user_ip, user_agent) VALUES ('f30af60e-cd0c-452e-aeb5-8bb987b22cb7', '550e8400-e29b-41d4-a716-446655440001', NULL, NULL, '{}', true, '2025-09-10 02:18:53.962578+00', '2025-09-10 02:18:53.962578+00', NULL, NULL);

INSERT INTO public.conversations (id, bot_id, session_id, title, metadata, is_active, created_at, updated_at, user_ip, user_agent) VALUES ('a5b57bb8-7448-4a85-8c6e-c4c28de67e02', '550e8400-e29b-41d4-a716-446655440001', NULL, NULL, '{}', true, '2025-09-10 03:39:17.90268+00', '2025-09-10 03:39:17.90268+00', NULL, NULL);INSERT INTO public.conversations (id, bot_id, session_id, title, metadata, is_active, created_at, updated_at, user_ip, user_agent) VALUES ('a5b57bb8-7448-4a85-8c6e-c4c28de67e02', '550e8400-e29b-41d4-a716-446655440001', NULL, NULL, '{}', true, '2025-09-10 03:39:17.90268+00', '2025-09-10 03:39:17.90268+00', NULL, NULL);

INSERT INTO public.conversations (id, bot_id, session_id, title, metadata, is_active, created_at, updated_at, user_ip, user_agent) VALUES ('fb4f5512-21a3-4771-998f-cdd7a8545661', '550e8400-e29b-41d4-a716-446655440001', NULL, NULL, '{}', true, '2025-09-10 04:28:41.742743+00', '2025-09-10 04:28:41.742743+00', NULL, NULL);INSERT INTO public.conversations (id, bot_id, session_id, title, metadata, is_active, created_at, updated_at, user_ip, user_agent) VALUES ('fb4f5512-21a3-4771-998f-cdd7a8545661', '550e8400-e29b-41d4-a716-446655440001', NULL, NULL, '{}', true, '2025-09-10 04:28:41.742743+00', '2025-09-10 04:28:41.742743+00', NULL, NULL);

INSERT INTO public.conversations (id, bot_id, session_id, title, metadata, is_active, created_at, updated_at, user_ip, user_agent) VALUES ('95ee1cb2-eaa7-4699-91a8-a6d823679956', '550e8400-e29b-41d4-a716-446655440001', NULL, NULL, '{}', true, '2025-09-10 04:28:53.134193+00', '2025-09-10 04:28:53.134193+00', NULL, NULL);INSERT INTO public.conversations (id, bot_id, session_id, title, metadata, is_active, created_at, updated_at, user_ip, user_agent) VALUES ('95ee1cb2-eaa7-4699-91a8-a6d823679956', '550e8400-e29b-41d4-a716-446655440001', NULL, NULL, '{}', true, '2025-09-10 04:28:53.134193+00', '2025-09-10 04:28:53.134193+00', NULL, NULL);

INSERT INTO public.conversations (id, bot_id, session_id, title, metadata, is_active, created_at, updated_at, user_ip, user_agent) VALUES ('385028a7-9349-4a73-9db0-0b37f4732496', '550e8400-e29b-41d4-a716-446655440001', NULL, NULL, '{}', true, '2025-09-10 04:34:32.978906+00', '2025-09-10 04:34:32.978906+00', NULL, NULL);INSERT INTO public.conversations (id, bot_id, session_id, title, metadata, is_active, created_at, updated_at, user_ip, user_agent) VALUES ('385028a7-9349-4a73-9db0-0b37f4732496', '550e8400-e29b-41d4-a716-446655440001', NULL, NULL, '{}', true, '2025-09-10 04:34:32.978906+00', '2025-09-10 04:34:32.978906+00', NULL, NULL);

INSERT INTO public.conversations (id, bot_id, session_id, title, metadata, is_active, created_at, updated_at, user_ip, user_agent) VALUES ('06081f67-5b56-4b5d-95c6-ff3903876da6', '550e8400-e29b-41d4-a716-446655440001', NULL, NULL, '{}', true, '2025-09-10 04:35:07.972363+00', '2025-09-10 04:35:07.972363+00', NULL, NULL);INSERT INTO public.conversations (id, bot_id, session_id, title, metadata, is_active, created_at, updated_at, user_ip, user_agent) VALUES ('06081f67-5b56-4b5d-95c6-ff3903876da6', '550e8400-e29b-41d4-a716-446655440001', NULL, NULL, '{}', true, '2025-09-10 04:35:07.972363+00', '2025-09-10 04:35:07.972363+00', NULL, NULL);





----

-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres

----



INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('8226146c-9c86-4a6a-bb9a-0545463040e4', '075862d6-0609-4f84-a27b-48cf08c756c0', 'user', 'Hello! Can you help me test this chatbot?', '[]', '{}', '{}', 1, '2025-09-10 02:04:05.474022+00', NULL);INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('8226146c-9c86-4a6a-bb9a-0545463040e4', '075862d6-0609-4f84-a27b-48cf08c756c0', 'user', 'Hello! Can you help me test this chatbot?', '[]', '{}', '{}', 1, '2025-09-10 02:04:05.474022+00', NULL);

INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('cf51a450-7019-45cc-af55-dc702c3568a3', '075862d6-0609-4f84-a27b-48cf08c756c0', 'assistant', 'Hello! I''m the Customer Support Bot chatbot. I''m working correctly, but the OpenAI API quota has been exceeded. This is a test response to demonstrate that the chat system is functioning properly. Please add credits to your OpenAI account to get real AI responses.', '[]', '{"prompt_tokens": 50, "completion_tokens": 30, "total_tokens": 80}', '{}', 2, '2025-09-10 02:04:05.474022+00', NULL);INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('cf51a450-7019-45cc-af55-dc702c3568a3', '075862d6-0609-4f84-a27b-48cf08c756c0', 'assistant', 'Hello! I''m the Customer Support Bot chatbot. I''m working correctly, but the OpenAI API quota has been exceeded. This is a test response to demonstrate that the chat system is functioning properly. Please add credits to your OpenAI account to get real AI responses.', '[]', '{"prompt_tokens": 50, "completion_tokens": 30, "total_tokens": 80}', '{}', 2, '2025-09-10 02:04:05.474022+00', NULL);

INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('a28d0bc8-2c66-4325-8dd7-3479c47b5062', 'bd37c33d-1e36-4835-a875-c7e9bafba72c', 'user', 'Hello, just a quick test message. Please respond briefly.', '[]', '{}', '{}', 1, '2025-09-10 02:13:35.402863+00', NULL);INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('a28d0bc8-2c66-4325-8dd7-3479c47b5062', 'bd37c33d-1e36-4835-a875-c7e9bafba72c', 'user', 'Hello, just a quick test message. Please respond briefly.', '[]', '{}', '{}', 1, '2025-09-10 02:13:35.402863+00', NULL);

INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('1473a5c9-4bc2-4516-85b0-70ceb46d3466', 'bd37c33d-1e36-4835-a875-c7e9bafba72c', 'assistant', 'Hello! I''m the Customer Support Bot chatbot. I''m working correctly, but the OpenAI API quota has been exceeded. This is a test response to demonstrate that the chat system is functioning properly. Please add credits to your OpenAI account to get real AI responses.', '[]', '{"prompt_tokens": 50, "completion_tokens": 30, "total_tokens": 80}', '{}', 2, '2025-09-10 02:13:35.402863+00', NULL);INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('1473a5c9-4bc2-4516-85b0-70ceb46d3466', 'bd37c33d-1e36-4835-a875-c7e9bafba72c', 'assistant', 'Hello! I''m the Customer Support Bot chatbot. I''m working correctly, but the OpenAI API quota has been exceeded. This is a test response to demonstrate that the chat system is functioning properly. Please add credits to your OpenAI account to get real AI responses.', '[]', '{"prompt_tokens": 50, "completion_tokens": 30, "total_tokens": 80}', '{}', 2, '2025-09-10 02:13:35.402863+00', NULL);

INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('c6e73544-5f54-4e96-97ca-a5e6e19fcea2', 'cd18c3f6-b011-4eb4-bda2-eef763352777', 'user', 'Hello, test message', '[]', '{}', '{}', 1, '2025-09-10 02:18:12.286188+00', NULL);INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('c6e73544-5f54-4e96-97ca-a5e6e19fcea2', 'cd18c3f6-b011-4eb4-bda2-eef763352777', 'user', 'Hello, test message', '[]', '{}', '{}', 1, '2025-09-10 02:18:12.286188+00', NULL);

INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('a035bd09-c386-486b-83cb-742e87ad3008', 'cd18c3f6-b011-4eb4-bda2-eef763352777', 'assistant', 'Hello! How can I assist you today? Let me know if you have any questions or need help with anything.', '[]', '{"prompt_tokens": 28, "completion_tokens": 23, "total_tokens": 51}', '{}', 2, '2025-09-10 02:18:12.286188+00', NULL);INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('a035bd09-c386-486b-83cb-742e87ad3008', 'cd18c3f6-b011-4eb4-bda2-eef763352777', 'assistant', 'Hello! How can I assist you today? Let me know if you have any questions or need help with anything.', '[]', '{"prompt_tokens": 28, "completion_tokens": 23, "total_tokens": 51}', '{}', 2, '2025-09-10 02:18:12.286188+00', NULL);

INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('7cd81e91-7e35-435f-bb76-56ee79208db2', 'f30af60e-cd0c-452e-aeb5-8bb987b22cb7', 'user', 'Can you explain what a chatbot API does? Please give me a detailed explanation.', '[]', '{}', '{}', 1, '2025-09-10 02:18:54.160613+00', NULL);INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('7cd81e91-7e35-435f-bb76-56ee79208db2', 'f30af60e-cd0c-452e-aeb5-8bb987b22cb7', 'user', 'Can you explain what a chatbot API does? Please give me a detailed explanation.', '[]', '{}', '{}', 1, '2025-09-10 02:18:54.160613+00', NULL);

INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('e9005bbb-6d1f-41ea-898f-18d483bfaa0f', 'f30af60e-cd0c-452e-aeb5-8bb987b22cb7', 'assistant', 'Certainly! A chatbot API, or Application Programming Interface, allows developers to integrate chatbot functionality into their own applications or platforms. INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('e9005bbb-6d1f-41ea-898f-18d483bfaa0f', 'f30af60e-cd0c-452e-aeb5-8bb987b22cb7', 'assistant', 'Certainly! A chatbot API, or Application Programming Interface, allows developers to integrate chatbot functionality into their own applications or platforms. 



With a chatbot API, developers can send and receive messages to and from a chatbot, trigger specific actions or responses, and customize the chatbot''s behavior based on their needs. This allows for seamless communication between users and the chatbot within different applications or channels.With a chatbot API, developers can send and receive messages to and from a chatbot, trigger specific actions or responses, and customize the chatbot''s behavior based on their needs. This allows for seamless communication between users and the chatbot within different applications or channels.



Moreover, a chatbot API typically provides developers with tools and resources to easily build, deploy, and manage chatbots without having to develop the underlying chatbot technology from scratch. This streamlines the development process and enables developers to focus on creating engaging and effective chatbot experiences for users.Moreover, a chatbot API typically provides developers with tools and resources to easily build, deploy, and manage chatbots without having to develop the underlying chatbot technology from scratch. This streamlines the development process and enables developers to focus on creating engaging and effective chatbot experiences for users.



Overall, a chatbot API simplifies the integration of chatbot capabilities into various applications, making it easier for developers to leverage the power of chatbots for improving customer service, automating tasks, providing information, and more.', '[]', '{"prompt_tokens": 41, "completion_tokens": 183, "total_tokens": 224}', '{}', 2, '2025-09-10 02:18:54.160613+00', NULL);Overall, a chatbot API simplifies the integration of chatbot capabilities into various applications, making it easier for developers to leverage the power of chatbots for improving customer service, automating tasks, providing information, and more.', '[]', '{"prompt_tokens": 41, "completion_tokens": 183, "total_tokens": 224}', '{}', 2, '2025-09-10 02:18:54.160613+00', NULL);

INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('062fad99-7bd8-4165-acf8-f0f96c22e5d9', 'a5b57bb8-7448-4a85-8c6e-c4c28de67e02', 'user', 'Hello! Test the new public endpoint without authentication.', '[]', '{}', '{}', 1, '2025-09-10 03:39:17.919436+00', NULL);INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('062fad99-7bd8-4165-acf8-f0f96c22e5d9', 'a5b57bb8-7448-4a85-8c6e-c4c28de67e02', 'user', 'Hello! Test the new public endpoint without authentication.', '[]', '{}', '{}', 1, '2025-09-10 03:39:17.919436+00', NULL);

INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('b067bcfa-8dab-461c-9d13-e15058ebcb44', 'a5b57bb8-7448-4a85-8c6e-c4c28de67e02', 'assistant', 'Hello! Thank you for reaching out. I will test the new public endpoint without authentication and get back to you with the results shortly. If you have any other questions or need further assistance, please feel free to let me know.', '[]', '{"prompt_tokens": 34, "completion_tokens": 46, "total_tokens": 80}', '{}', 2, '2025-09-10 03:39:17.919436+00', NULL);INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('b067bcfa-8dab-461c-9d13-e15058ebcb44', 'a5b57bb8-7448-4a85-8c6e-c4c28de67e02', 'assistant', 'Hello! Thank you for reaching out. I will test the new public endpoint without authentication and get back to you with the results shortly. If you have any other questions or need further assistance, please feel free to let me know.', '[]', '{"prompt_tokens": 34, "completion_tokens": 46, "total_tokens": 80}', '{}', 2, '2025-09-10 03:39:17.919436+00', NULL);

INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('08340bb7-772d-4a52-b883-02b425b10e49', 'fb4f5512-21a3-4771-998f-cdd7a8545661', 'user', 'Hello, how are you?', '[]', '{}', '{}', 1, '2025-09-10 04:28:41.763392+00', NULL);INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('08340bb7-772d-4a52-b883-02b425b10e49', 'fb4f5512-21a3-4771-998f-cdd7a8545661', 'user', 'Hello, how are you?', '[]', '{}', '{}', 1, '2025-09-10 04:28:41.763392+00', NULL);

INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('d7f7f953-f825-4f47-b344-0794d32d7000', 'fb4f5512-21a3-4771-998f-cdd7a8545661', 'assistant', 'Hello! I''m doing well, thank you for asking. How can I assist you today?', '[]', '{"prompt_tokens": 30, "completion_tokens": 19, "total_tokens": 49}', '{}', 2, '2025-09-10 04:28:41.763392+00', NULL);INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('d7f7f953-f825-4f47-b344-0794d32d7000', 'fb4f5512-21a3-4771-998f-cdd7a8545661', 'assistant', 'Hello! I''m doing well, thank you for asking. How can I assist you today?', '[]', '{"prompt_tokens": 30, "completion_tokens": 19, "total_tokens": 49}', '{}', 2, '2025-09-10 04:28:41.763392+00', NULL);

INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('9b38ab66-0cef-4dbd-9903-f4164ebba943', '95ee1cb2-eaa7-4699-91a8-a6d823679956', 'user', 'Tell me a short joke', '[]', '{}', '{}', 1, '2025-09-10 04:28:53.135561+00', NULL);INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('9b38ab66-0cef-4dbd-9903-f4164ebba943', '95ee1cb2-eaa7-4699-91a8-a6d823679956', 'user', 'Tell me a short joke', '[]', '{}', '{}', 1, '2025-09-10 04:28:53.135561+00', NULL);

INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('eab4fb0f-82a4-4bdf-bf6d-0c05c74371d8', '95ee1cb2-eaa7-4699-91a8-a6d823679956', 'assistant', 'Sure! Here''s a joke for you: Why couldn''t the bicycle stand up by itself? Because it was two tired! 😄', '[]', '{"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}', '{}', 2, '2025-09-10 04:28:53.135561+00', NULL);INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('eab4fb0f-82a4-4bdf-bf6d-0c05c74371d8', '95ee1cb2-eaa7-4699-91a8-a6d823679956', 'assistant', 'Sure! Here''s a joke for you: Why couldn''t the bicycle stand up by itself? Because it was two tired! 😄', '[]', '{"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}', '{}', 2, '2025-09-10 04:28:53.135561+00', NULL);

INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('8fd44c33-0781-4e47-9f6b-f0dffeb52b92', '385028a7-9349-4a73-9db0-0b37f4732496', 'user', 'Hello! Can you confirm the system is working?', '[]', '{}', '{}', 1, '2025-09-10 04:34:32.999411+00', NULL);INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('8fd44c33-0781-4e47-9f6b-f0dffeb52b92', '385028a7-9349-4a73-9db0-0b37f4732496', 'user', 'Hello! Can you confirm the system is working?', '[]', '{}', '{}', 1, '2025-09-10 04:34:32.999411+00', NULL);

INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('ab5c1d26-387e-42fc-900f-e6444a41271a', '385028a7-9349-4a73-9db0-0b37f4732496', 'assistant', 'Hello! I''ll be happy to assist you. Can you please provide me with more information about which system you are referring to?', '[]', '{"prompt_tokens": 34, "completion_tokens": 26, "total_tokens": 60}', '{}', 2, '2025-09-10 04:34:32.999411+00', NULL);INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('ab5c1d26-387e-42fc-900f-e6444a41271a', '385028a7-9349-4a73-9db0-0b37f4732496', 'assistant', 'Hello! I''ll be happy to assist you. Can you please provide me with more information about which system you are referring to?', '[]', '{"prompt_tokens": 34, "completion_tokens": 26, "total_tokens": 60}', '{}', 2, '2025-09-10 04:34:32.999411+00', NULL);

INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('dece69fc-78bf-41ae-86e5-ffbdc63e327c', '06081f67-5b56-4b5d-95c6-ff3903876da6', 'user', 'Test streaming response', '[]', '{}', '{}', 1, '2025-09-10 04:35:07.973985+00', NULL);INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('dece69fc-78bf-41ae-86e5-ffbdc63e327c', '06081f67-5b56-4b5d-95c6-ff3903876da6', 'user', 'Test streaming response', '[]', '{}', '{}', 1, '2025-09-10 04:35:07.973985+00', NULL);

INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('5ee20bb4-cada-486a-8889-7df39aed1ec9', '06081f67-5b56-4b5d-95c6-ff3903876da6', 'assistant', 'I''m here to assist you! How can I help you with your streaming test?', '[]', '{"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}', '{}', 2, '2025-09-10 04:35:07.973985+00', NULL);INSERT INTO public.messages (id, conversation_id, role, content, citations, token_usage, metadata, sequence_number, created_at, response_time_ms) VALUES ('5ee20bb4-cada-486a-8889-7df39aed1ec9', '06081f67-5b56-4b5d-95c6-ff3903876da6', 'assistant', 'I''m here to assist you! How can I help you with your streaming test?', '[]', '{"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}', '{}', 2, '2025-09-10 04:35:07.973985+00', NULL);





----

-- PostgreSQL database dump complete-- PostgreSQL database dump complete

----



\unrestrict tUZmTBULYf0XgG81bjBznHgpeO9WkwWmx6e8ipunJE8cFqauY2m1I7ZJnaOpAiQ\unrestrict tUZmTBULYf0XgG81bjBznHgpeO9WkwWmx6e8ipunJE8cFqauY2m1I7ZJnaOpAiQ

