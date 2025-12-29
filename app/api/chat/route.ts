import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const { messages, model = 'gpt-3.5-turbo', baseUrl, apiKey, parameters = {}, stream = false } = await req.json();

        if (!apiKey) {
            return NextResponse.json(
                { error: 'API Key is required. Please set it in Settings.' },
                { status: 400 }
            );
        }

        const providerUrl = baseUrl || 'https://api.openai.com/v1';
        const cleanUrl = providerUrl.endsWith('/') ? providerUrl.slice(0, -1) : providerUrl;

        // Transform messages to handle file_id parts for providers that don't support them
        const transformedMessages = messages.map((msg: any) => {
            if (Array.isArray(msg.content)) {
                return {
                    ...msg,
                    content: msg.content.map((part: any) => {
                        if (part.type === 'file') {
                            // Use the format requested by the user
                            return {
                                type: 'file',
                                file: {
                                    filename: part.file.filename,
                                    file_data: part.file.file_data
                                }
                            };
                        }
                        if (part.type === 'file_id') {
                            const { name, content, id } = part.file_id;
                            if (content) {
                                return {
                                    type: 'text',
                                    text: `File content for "${name || id}":\n\n${content}`
                                };
                            } else {
                                return {
                                    type: 'text',
                                    text: `[File attached: ${name || id}]`
                                };
                            }
                        }
                        return part;
                    })
                };
            }
            return msg;
        });
       
        // Clean parameters to remove undefined/null values
        const cleanParameters = Object.fromEntries(
            Object.entries(parameters).filter(([_, v]) => v != null)
        );
        console.log(transformedMessages)
        const response = await axios.post(
            `${cleanUrl}/chat/completions`,
            {
                model,
                messages: transformedMessages,
                stream,
                ...(stream ? { stream_options: { include_usage: true } } : {}),
                ...cleanParameters,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                responseType: stream ? 'stream' : 'json',
                // In Edge runtime, we need to ensure axios uses fetch
                adapter: 'fetch',
            }
        );

        if (stream) {
            // Proxy the stream
            return new Response(response.data, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            });
        } else {
            // Return JSON response directly
            return NextResponse.json(response.data);
        }
    } catch (error: any) {
        console.error('Chat error:', error);

        let errorMessage = 'Internal Server Error';
        let status = 500;

        if (axios.isAxiosError(error)) {
            status = error.response?.status || 500;
            // If responseType is 'stream', error.response.data might be a stream
            errorMessage = error.message;
            if (error.response?.data && !(error.response.data instanceof ReadableStream)) {
                errorMessage = error.response.data.error?.message || error.response.data.error || error.message;
            }
        }

        return NextResponse.json(
            { error: errorMessage },
            { status }
        );
    }
}

