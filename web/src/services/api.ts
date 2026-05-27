import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Source {
  id: string;
  name: string;
  type: string;
  config_json?: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  source_id: string;
  external_id?: string;
  title: string;
  author: string;
  url?: string;
  content_type: string;
  word_count: number;
  language: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Chunk {
  id: string;
  document_id: string;
  chunk_index: number;
  text: string;
  token_count: number;
  start_offset: number;
  end_offset: number;
  created_at: string;
}

export const ragApi = createApi({
  reducerPath: 'ragApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v1' }),
  tagTypes: ['Sources', 'Documents', 'Chunks'],
  endpoints: (builder) => ({
    listSources: builder.query<Source[], void>({
      query: () => 'sources',
      transformResponse: (response: { items: Source[] }) => response.items ?? [],
      providesTags: ['Sources'],
    }),
    createSource: builder.mutation<{ id: string; name: string }, Partial<Source> & { config?: Record<string, unknown> }>({
      query: (body) => ({ url: 'sources', method: 'POST', body }),
      invalidatesTags: ['Sources'],
    }),
    listDocuments: builder.query<Document[], void>({
      query: () => 'documents',
      transformResponse: (response: { items: Document[] }) => response.items ?? [],
      providesTags: ['Documents'],
    }),
    getDocument: builder.query<Document, string>({
      query: (id) => `documents/${id}`,
    }),
    listChunks: builder.query<Chunk[], string>({
      query: (docId) => `documents/${docId}/chunks`,
      transformResponse: (response: { items: Chunk[] }) => response.items ?? [],
    }),
  }),
});

export const {
  useListSourcesQuery,
  useCreateSourceMutation,
  useListDocumentsQuery,
  useGetDocumentQuery,
  useListChunksQuery,
} = ragApi;
