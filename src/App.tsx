import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload } from "lucide-react";
import { FiGithub } from "react-icons/fi";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

export default function App() {
  const [apiKey, setApiKey] = useState("");
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const handleGitHubClick = () => {
    window.open(
      "https://github.com/shivankkunwar/Gemini-Document-processor",
      "_blank"
    );
  };

  const extractExcelContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        let content = "";
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          content += `Sheet: ${sheetName}\n`;
          content += XLSX.utils.sheet_to_csv(worksheet) + "\n\n";
        });
        resolve(content);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      const allowedTypes = [
        "image/",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];
      if (allowedTypes.some((type) => selectedFile.type.startsWith(type))) {
        setFile(selectedFile);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, image, or Excel (.xlsx) file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleGenerate = async () => {
    if (!apiKey || !prompt || !file) return;

    setLoading(true);
    setResponse("");

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      let content: string;
      if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        content = await extractExcelContent(file);
      } else {
        // For PDFs and images, use base64 encoding
        content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(",")[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const result = await model.generateContent([
        file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          ? { text: `Excel file content:\n${content}` }
          : {
              inlineData: {
                data: content,
                mimeType: file.type,
              },
            },
        { text: prompt },
      ]);

      setResponse(result.response.text());
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "Error",
        description:
          "An error occurred while processing the file. Please check your API key and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-screen px-9 md:px-20 py-5 md:py-10 items-center">
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
            <CardTitle>Document Processor using Gemini AI (PDF, Image, Excel)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Enter your Gemini API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <Input
              type="file"
              accept=".pdf,.xlsx,.png,.jpeg,.jpg,.webp,.heic,.heif"
              onChange={handleFileChange}
            />
            <Textarea
              placeholder="Enter your custom prompt for document processing"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
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
                  Process Document
                </>
              )}
            </Button>
            <Textarea
              placeholder="Generated insights will appear here..."
              value={response}
              readOnly
              rows={6}
              className="mt-4"
            />
          </CardContent>
        </Card>
      </div>
      <footer>
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
