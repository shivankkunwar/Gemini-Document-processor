import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload } from "lucide-react";
import { FiGithub } from "react-icons/fi";

export default function App() {
  const [apiKey, setApiKey] = useState("");
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };
  const handleGitHubClick = () => {
    window.open(
      "https://github.com/shivankkunwar/Gemini-Document-processor",
      "_blank"
    );
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result?.toString().split(",")[1];
        if (base64) {
          resolve(base64);
        } else {
          reject(new Error("Failed to read file as base64"));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const handleGenerate = async () => {
    if (!apiKey || !prompt || !file) return;

    setLoading(true);
    setResponse("");

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const base64 = await readFileAsBase64(file);

      const result = await model.generateContent([
        {
          inlineData: {
            data: base64,
            mimeType: "application/pdf",
          },
        },
        { text: prompt },
      ]);

      setResponse(result.response.text());
    } catch (error) {
      console.error("Error processing document:", error);
      setResponse(
        "An error occurred while processing the document. Please check your API key and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen px-20 py-10 items-center">
      <Button
        variant="outline"
        size="sm"
        className="text-white w-fit bg-slate-950 p-5 border-white/20 hover:bg-white/10"
        onClick={handleGitHubClick}
      >
        <FiGithub className="mr-2" />
        GitHub
      </Button>
      <div className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Document Processor using Gemini AI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Enter your Gemini API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <Input type="file" accept=".pdf" onChange={handleFileChange} />
            <Textarea
              placeholder="Enter your custom prompt for document processing"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
            />
            <Button
              onClick={handleGenerate}
              disabled={!apiKey || !prompt || !file || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Process PDF
                </>
              )}
            </Button>
            <Textarea
              placeholder="Generated insights will appear here..."
              value={response}
              readOnly
              rows={8}
              className="mt-4"
            />
            
          </CardContent>
        </Card>
      </div>
      <footer >
              <p>
              From concept to code ⚔️ by{" "}
                <a
                  href="https://portfolio-shivank.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Shivank
                </a>
              </p>
            </footer>
    </div>
  );
}
