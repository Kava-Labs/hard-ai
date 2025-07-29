import { useState } from 'react';
import styles from './DisplayCards.module.css';
import { ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  url: string;
  publishedDate?: string;
  author?: string;
  text: string;
  image?: string;
  favicon?: string;
}

interface ExaSearchResponse {
  results: SearchResult[];
  searchTime?: number;
}

interface WebSearchAnnotationProps {
  toolResult: string;
}

export const WebSearchAnnotation = ({
  toolResult,
}: WebSearchAnnotationProps) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  try {
    // Parse the tool result for exa_mcp-web_search_exa
    const parsedResult = JSON.parse(toolResult);

    // Handle the current MCP response format: { "type": "text", "text": "{...}" }
    if (parsedResult.type !== 'text' || !parsedResult.text) {
      return null;
    }

    const searchResponse: ExaSearchResponse = JSON.parse(parsedResult.text);
    if (!searchResponse.results || searchResponse.results.length === 0) {
      return null;
    }

    const formatDate = (dateString?: string) => {
      if (!dateString) {
        return null;
      }

      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      } catch {
        return null;
      }
    };

    const truncateText = (text: string, maxLength: number = 200) => {
      if (text.length <= maxLength) {
        return text;
      }

      return text.substring(0, maxLength).trim() + '...';
    };

    const getHostname = (url: string) => {
      try {
        // Could throw if URL is invalid
        return new URL(url).hostname;
      } catch {
        return url;
      }
    };

    return (
      <>
        <div className={styles.searchResultsHeader}>
          <button
            className={styles.collapseButton}
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? (
              <ChevronRight className={styles.chevronIcon} />
            ) : (
              <ChevronDown className={styles.chevronIcon} />
            )}
            <span className={styles.searchResultsCount}>
              {searchResponse.results.length} results found
            </span>
          </button>
        </div>

        {!isCollapsed && (
          <>
            <div className={styles.searchResultsList}>
              {searchResponse.results.map((result, index) => (
                <div key={result.id || index} className={styles.searchResult}>
                  <div className={styles.resultHeader}>
                    {result.favicon && (
                      <img
                        src={result.favicon}
                        alt=""
                        className={styles.favicon}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.resultTitle}
                    >
                      {result.title}
                      <ExternalLink className={styles.externalIcon} />
                    </a>
                  </div>

                  <div className={styles.resultMeta}>
                    <span className={styles.resultUrl}>
                      {getHostname(result.url)}
                    </span>
                    {result.publishedDate && (
                      <span className={styles.resultDate}>
                        {formatDate(result.publishedDate)}
                      </span>
                    )}
                    {result.author && (
                      <span className={styles.resultAuthor}>
                        by {result.author}
                      </span>
                    )}
                  </div>

                  {result.text && (
                    <p className={styles.resultText}>
                      {truncateText(result.text)}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {searchResponse.searchTime && (
              <div className={styles.searchFooter}>
                <span className={styles.searchTime}>
                  {(searchResponse.searchTime / 1000).toFixed(2)}s
                </span>
              </div>
            )}
          </>
        )}
      </>
    );
  } catch (error) {
    console.error('Error parsing web search results:', error);
    return null;
  }
};
