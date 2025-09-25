// AUTO-GENERATED FILE. DO NOT EDIT.
// Validators built from specs/asyncapi.yaml (info.version: 3.2.1)

import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const COMPONENT_SCHEMAS = {
  "Session": {
    "type": "object",
    "properties": {
      "sessionId": {
        "type": "string",
        "description": "Unique session identifier lasting for duration of chat session or call"
      },
      "channel": {
        "$ref": "Channel"
      },
      "interface": {
        "$ref": "Interface"
      }
    }
  },
  "Channel": {
    "type": "object",
    "properties": {
      "browser": {
        "type": "string",
        "description": "Browser information"
      },
      "deviceInfo": {
        "type": "string",
        "description": "Device information (e.g., \"iOS/18.2, iPhone15,3\")"
      },
      "deviceType": {
        "type": "string",
        "description": "Type of device"
      },
      "language": {
        "type": "string",
        "description": "Interface language"
      },
      "location": {
        "type": "string",
        "description": "Geographic location (e.g., \"45.42,-75.69\")"
      },
      "medium": {
        "type": "string",
        "enum": [
          "chat",
          "voice",
          "email"
        ],
        "description": "Communication medium (allowed: chat, voice, email; default is chat if omitted)"
      },
      "metadata": {
        "type": "array",
        "description": "Custom metadata array"
      },
      "section": {
        "type": "string",
        "description": "Section of the application (e.g., \"cart\", \"product_page\")"
      }
    }
  },
  "Interface": {
    "type": "object",
    "properties": {
      "appVersion": {
        "type": "string",
        "description": "Custom application version"
      },
      "category": {
        "type": "string",
        "description": "Interface category (e.g., \"crm\", \"app\", \"auto\", \"widget\")"
      },
      "language": {
        "type": "string",
        "description": "Language from the CRM agent"
      },
      "name": {
        "type": "string",
        "description": "Interface name (e.g., \"salesforce\", \"zendesk\")"
      },
      "type": {
        "type": "string",
        "description": "Interface type (e.g., \"custom_components\", \"marketplace\", \"channel\")"
      }
    }
  },
  "RequestAttributes": {
    "type": "object",
    "properties": {
      "content": {
        "type": "string",
        "description": "Content to be processed"
      },
      "instruction": {
        "type": "string",
        "description": "Specific instruction for the action"
      },
      "variant": {
        "type": "string",
        "description": "Variant identifier (e.g., \"A\", \"B\")"
      }
    }
  },
  "Connections": {
    "type": "object",
    "properties": {
      "journeyId": {
        "type": "string",
        "description": "Journey identifier"
      },
      "parentId": {
        "type": "string",
        "description": "Parent request ID (previously trace_parent_ID in v2)"
      },
      "threadId": {
        "type": "string",
        "description": "Thread ID that remains unique across all requests related to same ticket/case/conversation"
      }
    }
  },
  "Context": {
    "type": "object",
    "properties": {
      "caseId": {
        "type": "string",
        "description": "Case identifier (advanced mode)"
      },
      "departmentId": {
        "type": "string",
        "description": "Department identifier (advanced mode)"
      },
      "operatorId": {
        "type": "string",
        "description": "Operator identifier (advanced mode)"
      },
      "organizationId": {
        "type": "string",
        "description": "Organization identifier"
      },
      "userId": {
        "type": "string",
        "description": "User identifier (advanced mode)"
      }
    }
  },
  "CodesItem": {
    "type": "object",
    "properties": {
      "id": {
        "type": "string",
        "description": "Optional for tracking/mapping"
      },
      "label": {
        "type": "string",
        "description": "Optional, helps for display/templating (e.g., \"Order Number\")"
      },
      "type": {
        "type": "string",
        "description": "Code type (e.g., \"order_number\", \"booking_reference\", \"ticket_code\")"
      },
      "value": {
        "type": "string",
        "description": "Code value (e.g., \"ORD-56789\")"
      }
    }
  },
  "LinkItem": {
    "type": "object",
    "properties": {
      "expires_at": {
        "type": "string",
        "description": "Optional expiration timestamp"
      },
      "html": {
        "type": "boolean",
        "description": "Optional HTML flag"
      },
      "id": {
        "type": "string",
        "description": "Optional link identifier"
      },
      "label": {
        "type": "string",
        "description": "Optional label (e.g., \"Click here to pay\")"
      },
      "type": {
        "type": "string",
        "description": "Link type (e.g., \"payment_link\")"
      },
      "url": {
        "type": "string",
        "description": "URL (e.g., \"https://checkout.stripe.com/pay/cs_test...\")"
      }
    }
  },
  "ReferenceId": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string"
      },
      "value": {
        "type": "string"
      }
    }
  },
  "Conversation": {
    "type": "object",
    "properties": {
      "conversationId": {
        "type": "string"
      },
      "participants": {
        "type": "array",
        "items": {
          "$ref": "Participant"
        }
      },
      "messages": {
        "type": "array",
        "items": {
          "$ref": "Message"
        }
      },
      "metadata": {
        "type": "object"
      }
    }
  },
  "Participant": {
    "type": "object",
    "properties": {
      "participantId": {
        "type": "string"
      },
      "displayName": {
        "type": "string"
      },
      "role": {
        "type": "string",
        "enum": [
          "operator",
          "user",
          "bot"
        ]
      }
    }
  },
  "Message": {
    "type": "object",
    "properties": {
      "content": {
        "type": "string"
      },
      "participantId": {
        "type": "string"
      },
      "timestamp": {
        "type": "string"
      }
    }
  },
  "Interaction": {
    "type": "object",
    "properties": {
      "content": {
        "type": "string"
      },
      "id": {
        "type": "string"
      },
      "name": {
        "type": "string"
      },
      "role": {
        "type": "string"
      },
      "timestamp": {
        "type": "string"
      }
    }
  },
  "Product": {
    "type": "object",
    "properties": {
      "id": {
        "type": "string"
      }
    }
  },
  "A2AConfiguration": {
    "type": "object",
    "properties": {
      "id": {
        "type": "string"
      },
      "name": {
        "type": "string"
      },
      "type": {
        "type": "string"
      }
    },
    "description": "Advanced mode agent-to-agent configuration"
  },
  "Cursor": {
    "type": "object",
    "properties": {
      "since": {
        "type": "string",
        "description": "Start timestamp (e.g., \"2024-01-15T10:30:00.000Z\")"
      },
      "until": {
        "type": "string",
        "description": "End timestamp (e.g., \"2024-01-15T11:00:00.000Z\")"
      }
    }
  },
  "SuperpowerResult": {
    "type": "object",
    "properties": {
      "response": {
        "type": "array",
        "items": {
          "$ref": "SuperpowerResponseItem"
        }
      }
    }
  },
  "SuperpowerResponseItem": {
    "type": "object",
    "description": "Response content varies by superpower type"
  },
  "ErrorResult": {
    "type": "object",
    "properties": {
      "response": {
        "type": "array",
        "items": {
          "$ref": "ErrorResponseItem"
        }
      }
    }
  },
  "ErrorResponseItem": {
    "type": "object",
    "properties": {
      "content": {
        "type": "string"
      },
      "error_code": {
        "type": "string"
      }
    },
    "required": [
      "content"
    ]
  },
  "MessageEnvelope": {
    "type": "object",
    "required": [
      "action",
      "headers",
      "payload"
    ],
    "properties": {
      "action": {
        "type": "string",
        "enum": [
          "message"
        ],
        "description": "Action type for the envelope"
      },
      "headers": {
        "type": "object",
        "required": [
          "correlationId",
          "action",
          "schemaRef"
        ],
        "properties": {
          "correlationId": {
            "type": "string",
            "format": "uuidv7",
            "description": "UUID for correlating request-response pairs (always generated client-side unless overridden)"
          },
          "tenantId": {
            "type": "string",
            "description": "Tenant identifier provided by Optave"
          },
          "traceId": {
            "type": "string",
            "format": "uuidv7",
            "description": "Optional cross-system tracing ID (forwarded if provided)"
          },
          "idempotencyKey": {
            "type": "string",
            "format": "uuidv7",
            "description": "Optional idempotency key; forwarded unchanged if provided"
          },
          "identifier": {
            "type": "string",
            "enum": [
              "message"
            ],
            "description": "Message identifier"
          },
          "action": {
            "type": "string",
            "enum": [
              "adjust",
              "elevate",
              "customerinteraction",
              "interaction",
              "reception",
              "summarize",
              "translate",
              "recommend",
              "insights"
            ],
            "description": "Specific action being performed"
          },
          "schemaRef": {
            "type": "string",
            "enum": [
              "optave.message.v3"
            ],
            "description": "Schema reference for the envelope (major version only; minor/patch changes are non-breaking)"
          },
          "sdkVersion": {
            "type": "string",
            "description": "SDK package version (independent of schemaRef major)"
          },
          "networkLatencyMs": {
            "type": "number",
            "description": "Optional client-measured round-trip latency (not sent unless explicitly supplied)"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time",
            "description": "ISO 8601 client timestamp when the message was built"
          },
          "issuedAt": {
            "type": "string",
            "format": "date-time",
            "description": "Message issued timestamp"
          }
        }
      },
      "payload": {
        "$ref": "Payload"
      }
    },
    "allOf": [
      {
        "type": "object",
        "required": [
          "action",
          "headers",
          "payload"
        ],
        "properties": {
          "action": {
            "type": "string",
            "enum": [
              "message"
            ]
          },
          "headers": {
            "type": "object"
          },
          "payload": {
            "type": "object"
          }
        }
      },
      {
        "if": {
          "properties": {
            "headers": {
              "properties": {
                "action": {
                  "enum": [
                    "adjust",
                    "elevate",
                    "interaction",
                    "customerInteraction"
                  ]
                }
              }
            }
          }
        },
        "then": {
          "properties": {
            "payload": {
              "$ref": "PayloadWithRequiredConversations"
            }
          }
        }
      },
      {
        "if": {
          "properties": {
            "headers": {
              "properties": {
                "action": {
                  "enum": [
                    "summarize",
                    "translate",
                    "insights",
                    "recommend"
                  ]
                }
              }
            }
          }
        },
        "then": {
          "properties": {
            "payload": {
              "$ref": "PayloadWithRequiredConversations"
            }
          }
        }
      }
    ]
  },
  "PayloadWithRequiredConversations": {
    "allOf": [
      {
        "$ref": "Payload"
      },
      {
        "type": "object",
        "required": [
          "request"
        ],
        "properties": {
          "request": {
            "type": "object",
            "required": [
              "scope"
            ],
            "properties": {
              "scope": {
                "type": "object",
                "required": [
                  "conversations"
                ],
                "properties": {
                  "conversations": {
                    "type": "array",
                    "minItems": 1,
                    "items": {
                      "$ref": "Conversation"
                    }
                  }
                }
              }
            }
          }
        }
      }
    ]
  },
  "Payload": {
    "type": "object",
    "required": [
      "session",
      "request"
    ],
    "properties": {
      "session": {
        "$ref": "Session"
      },
      "request": {
        "type": "object",
        "required": [
          "requestId"
        ],
        "properties": {
          "requestId": {
            "type": "string",
            "description": "Unique request identifier"
          },
          "attributes": {
            "$ref": "RequestAttributes"
          },
          "connections": {
            "$ref": "Connections"
          },
          "context": {
            "$ref": "Context"
          },
          "reference": {
            "type": "object",
            "properties": {
              "ids": {
                "type": "array",
                "items": {
                  "$ref": "ReferenceId"
                }
              },
              "labels": {
                "type": "array",
                "description": "Reference labels"
              },
              "tags": {
                "type": "array",
                "description": "Reference tags"
              }
            }
          },
          "resources": {
            "type": "object",
            "properties": {
              "codes": {
                "type": "array",
                "items": {
                  "$ref": "CodesItem"
                }
              },
              "links": {
                "type": "array",
                "items": {
                  "$ref": "LinkItem"
                }
              },
              "offers": {
                "type": "array",
                "description": "Offering details (previously offering_details in v2)"
              }
            }
          },
          "scope": {
            "type": "object",
            "properties": {
              "accounts": {
                "type": "array"
              },
              "appointments": {
                "type": "array"
              },
              "assets": {
                "type": "array"
              },
              "bookings": {
                "type": "array"
              },
              "cases": {
                "type": "array"
              },
              "conversations": {
                "type": "array",
                "items": {
                  "$ref": "Conversation"
                }
              },
              "documents": {
                "type": "array"
              },
              "events": {
                "type": "array"
              },
              "interactions": {
                "type": "array",
                "items": {
                  "$ref": "Interaction"
                }
              },
              "items": {
                "type": "array"
              },
              "locations": {
                "type": "array"
              },
              "offers": {
                "type": "array"
              },
              "operators": {
                "type": "array"
              },
              "orders": {
                "type": "array"
              },
              "organizations": {
                "type": "array"
              },
              "persons": {
                "type": "array"
              },
              "policies": {
                "type": "array"
              },
              "products": {
                "type": "array",
                "items": {
                  "$ref": "Product"
                }
              },
              "properties": {
                "type": "array"
              },
              "services": {
                "type": "array"
              },
              "subscriptions": {
                "type": "array"
              },
              "tickets": {
                "type": "array"
              },
              "transactions": {
                "type": "array"
              },
              "users": {
                "type": "array"
              }
            }
          },
          "settings": {
            "type": "object",
            "properties": {
              "disableBrowsing": {
                "type": "boolean",
                "default": false
              },
              "disableSearch": {
                "type": "boolean",
                "default": false
              },
              "disableSources": {
                "type": "boolean",
                "default": false
              },
              "disableStream": {
                "type": "boolean",
                "default": true
              },
              "disableTools": {
                "type": "boolean",
                "default": false
              },
              "maxResponseLength": {
                "type": "number",
                "default": 0
              },
              "overrideInterfaceLanguage": {
                "type": "string",
                "description": "Override interface language"
              },
              "overrideOutputLanguage": {
                "type": "string",
                "description": "Override output language (replaces channel language)"
              }
            }
          },
          "a2a": {
            "type": "array",
            "items": {
              "$ref": "A2AConfiguration"
            },
            "description": "Advanced mode agent-to-agent configuration"
          },
          "cursor": {
            "$ref": "Cursor"
          }
        }
      }
    }
  },
  "ResponseEnvelope": {
    "type": "object",
    "required": [
      "action",
      "headers",
      "payload"
    ],
    "properties": {
      "action": {
        "type": "string",
        "enum": [
          "message"
        ],
        "description": "Action type for the response envelope"
      },
      "headers": {
        "type": "object",
        "required": [
          "correlationId",
          "action",
          "schemaRef"
        ],
        "properties": {
          "correlationId": {
            "type": "string",
            "format": "uuidv7",
            "description": "UUID correlating this response to its originating request (echo of request correlationId)"
          },
          "tenantId": {
            "type": "string",
            "description": "Tenant identifier provided by Optave"
          },
          "traceId": {
            "type": "string",
            "format": "uuidv7",
            "description": "Optional cross-system tracing ID (forwarded if provided)"
          },
          "idempotencyKey": {
            "type": "string",
            "format": "uuidv7",
            "description": "Optional idempotency key (echoed if provided in request)"
          },
          "identifier": {
            "type": "string",
            "enum": [
              "message"
            ],
            "description": "Message identifier"
          },
          "action": {
            "type": "string",
            "enum": [
              "adjust",
              "elevate",
              "customerinteraction",
              "interaction",
              "reception",
              "summarize",
              "translate",
              "recommend",
              "insights"
            ],
            "description": "Specific action being performed"
          },
          "schemaRef": {
            "type": "string",
            "enum": [
              "optave.response.v3",
              "optave.error.v3"
            ],
            "description": "Schema reference for the response message"
          },
          "sdkVersion": {
            "type": "string",
            "description": "SDK package version of emitting client (mirrors request header)"
          },
          "networkLatencyMs": {
            "type": "number",
            "description": "Optional client-measured round-trip latency (not sent unless explicitly supplied)"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time",
            "description": "ISO 8601 server/processing timestamp when this response was generated"
          },
          "issuedAt": {
            "type": "string",
            "format": "date-time",
            "description": "Response issued timestamp"
          }
        }
      },
      "payload": {
        "oneOf": [
          {
            "$ref": "SuperpowerResponse"
          },
          {
            "$ref": "ErrorResponse"
          }
        ]
      }
    }
  },
  "SuperpowerResponse": {
    "type": "object",
    "required": [
      "action",
      "actionType",
      "state",
      "message"
    ],
    "properties": {
      "action": {
        "type": "string",
        "enum": [
          "superpower"
        ]
      },
      "actionType": {
        "type": "string",
        "description": "Type of superpower (e.g., adjust_suggestion, sentiment_analysis, risk_assessment)"
      },
      "state": {
        "type": "string",
        "enum": [
          "started",
          "completed",
          "error"
        ]
      },
      "message": {
        "type": "object",
        "required": [
          "results"
        ],
        "properties": {
          "results": {
            "type": "array",
            "items": {
              "$ref": "SuperpowerResult"
            }
          }
        }
      }
    }
  },
  "ErrorResponse": {
    "type": "object",
    "required": [
      "action",
      "actionType",
      "state",
      "message"
    ],
    "properties": {
      "action": {
        "type": "string",
        "enum": [
          "superpower"
        ]
      },
      "actionType": {
        "type": "string",
        "description": "Type of operation that failed"
      },
      "state": {
        "type": "string",
        "enum": [
          "error"
        ]
      },
      "message": {
        "type": "object",
        "required": [
          "results"
        ],
        "properties": {
          "results": {
            "type": "array",
            "items": {
              "$ref": "ErrorResult"
            }
          }
        }
      }
    }
  }
};
const TARGET_SCHEMAS = {
  "MessageEnvelope": {
    "type": "object",
    "required": [
      "action",
      "headers",
      "payload"
    ],
    "properties": {
      "action": {
        "type": "string",
        "enum": [
          "message"
        ],
        "description": "Action type for the envelope"
      },
      "headers": {
        "type": "object",
        "required": [
          "correlationId",
          "action",
          "schemaRef"
        ],
        "properties": {
          "correlationId": {
            "type": "string",
            "format": "uuidv7",
            "description": "UUID for correlating request-response pairs (always generated client-side unless overridden)"
          },
          "tenantId": {
            "type": "string",
            "description": "Tenant identifier provided by Optave"
          },
          "traceId": {
            "type": "string",
            "format": "uuidv7",
            "description": "Optional cross-system tracing ID (forwarded if provided)"
          },
          "idempotencyKey": {
            "type": "string",
            "format": "uuidv7",
            "description": "Optional idempotency key; forwarded unchanged if provided"
          },
          "identifier": {
            "type": "string",
            "enum": [
              "message"
            ],
            "description": "Message identifier"
          },
          "action": {
            "type": "string",
            "enum": [
              "adjust",
              "elevate",
              "customerinteraction",
              "interaction",
              "reception",
              "summarize",
              "translate",
              "recommend",
              "insights"
            ],
            "description": "Specific action being performed"
          },
          "schemaRef": {
            "type": "string",
            "enum": [
              "optave.message.v3"
            ],
            "description": "Schema reference for the envelope (major version only; minor/patch changes are non-breaking)"
          },
          "sdkVersion": {
            "type": "string",
            "description": "SDK package version (independent of schemaRef major)"
          },
          "networkLatencyMs": {
            "type": "number",
            "description": "Optional client-measured round-trip latency (not sent unless explicitly supplied)"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time",
            "description": "ISO 8601 client timestamp when the message was built"
          },
          "issuedAt": {
            "type": "string",
            "format": "date-time",
            "description": "Message issued timestamp"
          }
        }
      },
      "payload": {
        "$ref": "Payload"
      }
    },
    "allOf": [
      {
        "type": "object",
        "required": [
          "action",
          "headers",
          "payload"
        ],
        "properties": {
          "action": {
            "type": "string",
            "enum": [
              "message"
            ]
          },
          "headers": {
            "type": "object"
          },
          "payload": {
            "type": "object"
          }
        }
      },
      {
        "if": {
          "properties": {
            "headers": {
              "properties": {
                "action": {
                  "enum": [
                    "adjust",
                    "elevate",
                    "interaction",
                    "customerInteraction"
                  ]
                }
              }
            }
          }
        },
        "then": {
          "properties": {
            "payload": {
              "$ref": "PayloadWithRequiredConversations"
            }
          }
        }
      },
      {
        "if": {
          "properties": {
            "headers": {
              "properties": {
                "action": {
                  "enum": [
                    "summarize",
                    "translate",
                    "insights",
                    "recommend"
                  ]
                }
              }
            }
          }
        },
        "then": {
          "properties": {
            "payload": {
              "$ref": "PayloadWithRequiredConversations"
            }
          }
        }
      }
    ]
  },
  "ResponseEnvelope": {
    "type": "object",
    "required": [
      "action",
      "headers",
      "payload"
    ],
    "properties": {
      "action": {
        "type": "string",
        "enum": [
          "message"
        ],
        "description": "Action type for the response envelope"
      },
      "headers": {
        "type": "object",
        "required": [
          "correlationId",
          "action",
          "schemaRef"
        ],
        "properties": {
          "correlationId": {
            "type": "string",
            "format": "uuidv7",
            "description": "UUID correlating this response to its originating request (echo of request correlationId)"
          },
          "tenantId": {
            "type": "string",
            "description": "Tenant identifier provided by Optave"
          },
          "traceId": {
            "type": "string",
            "format": "uuidv7",
            "description": "Optional cross-system tracing ID (forwarded if provided)"
          },
          "idempotencyKey": {
            "type": "string",
            "format": "uuidv7",
            "description": "Optional idempotency key (echoed if provided in request)"
          },
          "identifier": {
            "type": "string",
            "enum": [
              "message"
            ],
            "description": "Message identifier"
          },
          "action": {
            "type": "string",
            "enum": [
              "adjust",
              "elevate",
              "customerinteraction",
              "interaction",
              "reception",
              "summarize",
              "translate",
              "recommend",
              "insights"
            ],
            "description": "Specific action being performed"
          },
          "schemaRef": {
            "type": "string",
            "enum": [
              "optave.response.v3",
              "optave.error.v3"
            ],
            "description": "Schema reference for the response message"
          },
          "sdkVersion": {
            "type": "string",
            "description": "SDK package version of emitting client (mirrors request header)"
          },
          "networkLatencyMs": {
            "type": "number",
            "description": "Optional client-measured round-trip latency (not sent unless explicitly supplied)"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time",
            "description": "ISO 8601 server/processing timestamp when this response was generated"
          },
          "issuedAt": {
            "type": "string",
            "format": "date-time",
            "description": "Response issued timestamp"
          }
        }
      },
      "payload": {
        "oneOf": [
          {
            "$ref": "SuperpowerResponse"
          },
          {
            "$ref": "ErrorResponse"
          }
        ]
      }
    }
  },
  "Payload": {
    "type": "object",
    "required": [
      "session",
      "request"
    ],
    "properties": {
      "session": {
        "$ref": "Session"
      },
      "request": {
        "type": "object",
        "required": [
          "requestId"
        ],
        "properties": {
          "requestId": {
            "type": "string",
            "description": "Unique request identifier"
          },
          "attributes": {
            "$ref": "RequestAttributes"
          },
          "connections": {
            "$ref": "Connections"
          },
          "context": {
            "$ref": "Context"
          },
          "reference": {
            "type": "object",
            "properties": {
              "ids": {
                "type": "array",
                "items": {
                  "$ref": "ReferenceId"
                }
              },
              "labels": {
                "type": "array",
                "description": "Reference labels"
              },
              "tags": {
                "type": "array",
                "description": "Reference tags"
              }
            }
          },
          "resources": {
            "type": "object",
            "properties": {
              "codes": {
                "type": "array",
                "items": {
                  "$ref": "CodesItem"
                }
              },
              "links": {
                "type": "array",
                "items": {
                  "$ref": "LinkItem"
                }
              },
              "offers": {
                "type": "array",
                "description": "Offering details (previously offering_details in v2)"
              }
            }
          },
          "scope": {
            "type": "object",
            "properties": {
              "accounts": {
                "type": "array"
              },
              "appointments": {
                "type": "array"
              },
              "assets": {
                "type": "array"
              },
              "bookings": {
                "type": "array"
              },
              "cases": {
                "type": "array"
              },
              "conversations": {
                "type": "array",
                "items": {
                  "$ref": "Conversation"
                }
              },
              "documents": {
                "type": "array"
              },
              "events": {
                "type": "array"
              },
              "interactions": {
                "type": "array",
                "items": {
                  "$ref": "Interaction"
                }
              },
              "items": {
                "type": "array"
              },
              "locations": {
                "type": "array"
              },
              "offers": {
                "type": "array"
              },
              "operators": {
                "type": "array"
              },
              "orders": {
                "type": "array"
              },
              "organizations": {
                "type": "array"
              },
              "persons": {
                "type": "array"
              },
              "policies": {
                "type": "array"
              },
              "products": {
                "type": "array",
                "items": {
                  "$ref": "Product"
                }
              },
              "properties": {
                "type": "array"
              },
              "services": {
                "type": "array"
              },
              "subscriptions": {
                "type": "array"
              },
              "tickets": {
                "type": "array"
              },
              "transactions": {
                "type": "array"
              },
              "users": {
                "type": "array"
              }
            }
          },
          "settings": {
            "type": "object",
            "properties": {
              "disableBrowsing": {
                "type": "boolean",
                "default": false
              },
              "disableSearch": {
                "type": "boolean",
                "default": false
              },
              "disableSources": {
                "type": "boolean",
                "default": false
              },
              "disableStream": {
                "type": "boolean",
                "default": true
              },
              "disableTools": {
                "type": "boolean",
                "default": false
              },
              "maxResponseLength": {
                "type": "number",
                "default": 0
              },
              "overrideInterfaceLanguage": {
                "type": "string",
                "description": "Override interface language"
              },
              "overrideOutputLanguage": {
                "type": "string",
                "description": "Override output language (replaces channel language)"
              }
            }
          },
          "a2a": {
            "type": "array",
            "items": {
              "$ref": "A2AConfiguration"
            },
            "description": "Advanced mode agent-to-agent configuration"
          },
          "cursor": {
            "$ref": "Cursor"
          }
        }
      }
    }
  },
  "SuperpowerResponse": {
    "type": "object",
    "required": [
      "action",
      "actionType",
      "state",
      "message"
    ],
    "properties": {
      "action": {
        "type": "string",
        "enum": [
          "superpower"
        ]
      },
      "actionType": {
        "type": "string",
        "description": "Type of superpower (e.g., adjust_suggestion, sentiment_analysis, risk_assessment)"
      },
      "state": {
        "type": "string",
        "enum": [
          "started",
          "completed",
          "error"
        ]
      },
      "message": {
        "type": "object",
        "required": [
          "results"
        ],
        "properties": {
          "results": {
            "type": "array",
            "items": {
              "$ref": "SuperpowerResult"
            }
          }
        }
      }
    }
  },
  "ErrorResponse": {
    "type": "object",
    "required": [
      "action",
      "actionType",
      "state",
      "message"
    ],
    "properties": {
      "action": {
        "type": "string",
        "enum": [
          "superpower"
        ]
      },
      "actionType": {
        "type": "string",
        "description": "Type of operation that failed"
      },
      "state": {
        "type": "string",
        "enum": [
          "error"
        ]
      },
      "message": {
        "type": "object",
        "required": [
          "results"
        ],
        "properties": {
          "results": {
            "type": "array",
            "items": {
              "$ref": "ErrorResult"
            }
          }
        }
      }
    }
  }
};

const ajv = new Ajv({strict:false, allErrors:true});
addFormats(ajv);
// Add UUIDv7 format validator to eliminate console warnings
ajv.addFormat("uuidv7", /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
// Add standard JSON Schema definitions that might be referenced
ajv.addSchema({
  "type": "integer",
  "minimum": 0
}, "nonNegativeInteger");
for (const [name, schema] of Object.entries(COMPONENT_SCHEMAS)) {
  try { ajv.addSchema(schema, name); } catch(e) { /* ignore duplicates */ }
}
const compiled = {};
for (const name of Object.keys(TARGET_SCHEMAS)) {
  const fn = ajv.getSchema(name) || ajv.compile(TARGET_SCHEMAS[name]);
  if (fn) compiled[name] = fn;
}
export function validate(name, data){
  const fn = compiled[name];
  if(!fn) return { valid:false, errors:[{ message: 'Unknown schema '+name }]};
  const valid = fn(data);
  return { valid, errors: fn.errors || null };
}
export const validateMessageEnvelope = (data) => validate('MessageEnvelope', data);
export const validateResponseEnvelope = (data) => validate('ResponseEnvelope', data);
export const validatePayload = (data) => validate('Payload', data);
export const validateSuperpowerResponse = (data) => validate('SuperpowerResponse', data);
export const validateErrorResponse = (data) => validate('ErrorResponse', data);
export const availableValidators = Object.keys(compiled);
