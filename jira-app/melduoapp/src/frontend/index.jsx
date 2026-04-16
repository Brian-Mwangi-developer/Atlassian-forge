import { invoke } from "@forge/bridge";
import ForgeReconciler, {
  Button,
  Heading,
  Stack,
  Text,
  Textfield,
  useProductContext,
} from "@forge/react";
import React, { useEffect, useMemo, useState } from "react";

const App = () => {
  const context = useProductContext();

  const inferredProjectKey =
    context?.extension?.project?.key ||
    context?.extension?.projectKey ||
    context?.platformContext?.projectKey ||
    "";

  const [hello, setHello] = useState(null);
  const [message, setMessage] = useState("");
  const [echo, setEcho] = useState(null);
  const [serverTime, setServerTime] = useState(null);

  const [projectKey, setProjectKey] = useState(inferredProjectKey);
  const [issues, setIssues] = useState([]);
  const [issuesError, setIssuesError] = useState(null);

  const [issueKey, setIssueKey] = useState("");
  const [comment, setComment] = useState("");
  const [commentResult, setCommentResult] = useState(null);

  const [isLoading, setIsLoading] = useState(false);

  const hasContext = useMemo(() => Boolean(context), [context]);

  useEffect(() => {
    invoke("getText", { example: "my-invoke-variable" }).then(setHello);
  }, []);

  useEffect(() => {
    if (inferredProjectKey && !projectKey) {
      setProjectKey(inferredProjectKey);
    }
  }, [inferredProjectKey, projectKey]);

  const onEcho = async () => {
    setIsLoading(true);
    try {
      const result = await invoke("echo", { message });
      setEcho(result);
    } finally {
      setIsLoading(false);
    }
  };

  const onGetServerTime = async () => {
    setIsLoading(true);
    try {
      const result = await invoke("getServerTime");
      setServerTime(result);
    } finally {
      setIsLoading(false);
    }
  };

  const onLoadIssues = async () => {
    setIsLoading(true);
    setIssuesError(null);
    setCommentResult(null);
    try {
      const res = await invoke("listIssues", { projectKey });
      setIssues(res?.issues || []);
      setIssuesError(res?.error || null);
    } finally {
      setIsLoading(false);
    }
  };

  const onAddComment = async () => {
    setIsLoading(true);
    setCommentResult(null);
    try {
      const res = await invoke("addComment", { issueKey, comment });
      if (res?.ok) {
        setCommentResult("Comment added.");
      } else {
        setCommentResult(res?.error || "Failed to add comment.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Stack space="space.300">
      <Heading size="medium">melduoapp</Heading>

      <Text>Context loaded: {hasContext ? "yes" : "no"}</Text>
      <Text>Inferred project key: {inferredProjectKey || "(none)"}</Text>

      <Heading size="small">Hello / tunnel demo</Heading>
      <Text>Hello world!</Text>
      <Text>{hello ? hello : "Loading..."}</Text>

      <Textfield
        name="message"
        label="Type something"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <Stack direction="horizontal" space="space.200">
        <Button appearance="primary" onClick={onEcho} isLoading={isLoading}>
          Echo
        </Button>
        <Button onClick={onGetServerTime} isLoading={isLoading}>
          Get server time
        </Button>
      </Stack>

      <Text>{echo ? echo : "Echo result will show here."}</Text>
      <Text>{serverTime ? `Server time: ${serverTime}` : ""}</Text>

      <Heading size="small">Jira issues (read)</Heading>
      <Textfield
        name="projectKey"
        label="Project key"
        value={projectKey}
        onChange={(e) => setProjectKey(e.target.value)}
      />
      <Button onClick={onLoadIssues} isLoading={isLoading}>
        Load latest issues
      </Button>

      <Text>{issuesError ? `Error: ${issuesError}` : ""}</Text>

      <Stack space="space.100">
        {issues.map((i) => (
          <Button
            key={i.key}
            appearance="subtle"
            onClick={() => setIssueKey(i.key)}
          >
            {i.key} — {i.summary} ({i.status})
          </Button>
        ))}
      </Stack>

      <Heading size="small">Add comment (write)</Heading>
      <Textfield
        name="issueKey"
        label="Issue key"
        value={issueKey}
        onChange={(e) => setIssueKey(e.target.value)}
      />
      <Textfield
        name="comment"
        label="Comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <Button appearance="primary" onClick={onAddComment} isLoading={isLoading}>
        Add comment
      </Button>

      <Text>{commentResult ? commentResult : ""}</Text>
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
