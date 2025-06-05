// Learn more about clients at https://docs.boundaryml.com/docs/snippets/clients/overview

client<llm> QueryGeneration {
  provider "openai-generic"
  options {
    base_url "https://api.cerebras.ai/v1"
    model "llama-4-scout-17b-16e-instruct"
    api_key env.CEREBRAS_API_KEY
  }
}

client<llm> DocumentAnalysis {
  provider openai
  options {
    model "gpt-4.1-mini"
    api_key env.OPENAI_API_KEY
  }
}

client<llm> FindingsSynthetizing {
  provider "openai-generic"
  options {
    base_url "https://api.cerebras.ai/v1"
    model "llama-4-scout-17b-16e-instruct"
    api_key env.CEREBRAS_API_KEY
  }
}

client<llm> DecidesNextStep {
  provider "openai-generic"
  options {
    base_url "https://api.cerebras.ai/v1"
    model "llama-4-scout-17b-16e-instruct"
    api_key env.CEREBRAS_API_KEY
  }
}

client<llm> GenerateFinalReport {
  provider "openai-generic"
  options {
    base_url "https://api.cerebras.ai/v1"
    model "llama-4-scout-17b-16e-instruct"
    api_key env.CEREBRAS_API_KEY
  }
}

client<llm> CustomCerebras {
  provider "openai-generic"
  options {
    base_url "https://api.cerebras.ai/v1"
    model "llama-4-scout-17b-16e-instruct"
    api_key env.CEREBRAS_API_KEY
  }
}

client<llm> GptMini {
  provider openai
  options {
    model "gpt-4.1-mini"
    api_key env.OPENAI_API_KEY
  }
}

client<llm> CustomGPT4oMini {
  provider openai
  options {
    model "gpt-4o-mini"
    api_key env.OPENAI_API_KEY
  }
}

client<llm> CustomSonnet {
  provider anthropic
  options {
    model "claude-3-5-sonnet-20241022"
    api_key env.ANTHROPIC_API_KEY
  }
}


client<llm> CustomHaiku {
  provider anthropic
  retry_policy Constant
  options {
    model "claude-3-haiku-20240307"
    api_key env.ANTHROPIC_API_KEY
  }
}

// https://docs.boundaryml.com/docs/snippets/clients/round-robin
client<llm> CustomFast {
  provider round-robin
  options {
    // This will alternate between the two clients
    strategy [CustomGPT4oMini, CustomHaiku]
  }
}

// https://docs.boundaryml.com/docs/snippets/clients/fallback
client<llm> OpenaiFallback {
  provider fallback
  options {
    // This will try the clients in order until one succeeds
    strategy [CustomGPT4oMini, CustomGPT4oMini]
  }
}

// https://docs.boundaryml.com/docs/snippets/clients/retry
retry_policy Constant {
  max_retries 3
  // Strategy is optional
  strategy {
    type constant_delay
    delay_ms 200
  }
}

retry_policy TestSafely {
  max_retries 1
  strategy {
    type exponential_backoff
    delay_ms 200
    multiplier 1.5
    max_delay_ms 10000
  }
}

retry_policy TestFast {
  max_retries 1
  strategy {
    type exponential_backoff
    delay_ms 200
    multiplier 1.5
    max_delay_ms 10000
  }
}
