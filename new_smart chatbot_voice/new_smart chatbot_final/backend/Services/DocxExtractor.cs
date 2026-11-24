using System;
using System.IO;
using System.Linq;
using System.Text;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace SmartChatbot.Api.Services
{
    public class DocxExtractor
    {
        public static string? ExtractText(string path)
        {
            if (!File.Exists(path))
            {
                return null;
            }

            var sb = new StringBuilder();

            try
            {
                using (WordprocessingDocument wordDoc = WordprocessingDocument.Open(path, false))
                {
                    var body = wordDoc.MainDocumentPart?.Document?.Body;
                    if (body == null)
                    {
                        return string.Empty;
                    }

                    foreach (var element in body.ChildElements)
                    {
                        if (element is Paragraph para)
                        {
                            var text = para.InnerText.Trim();
                            if (string.IsNullOrEmpty(text))
                            {
                                sb.AppendLine();
                                continue;
                            }

                            var styleId = para.ParagraphProperties?.ParagraphStyleId?.Val?.Value;
                            if (!string.IsNullOrEmpty(styleId))
                            {
                                var styleLower = styleId.ToLower();
                                if (styleLower.Contains("heading1") || styleLower.Contains("h1"))
                                {
                                    sb.AppendLine();
                                    sb.AppendLine(new string('=', 60));
                                    sb.AppendLine($"  {text.ToUpper()}");
                                    sb.AppendLine(new string('=', 60));
                                    sb.AppendLine();
                                }
                                else if (styleLower.Contains("heading2") || styleLower.Contains("h2"))
                                {
                                    sb.AppendLine();
                                    sb.AppendLine($"--- {text} ---");
                                    sb.AppendLine();
                                }
                                else if (styleLower.Contains("heading3") || styleLower.Contains("h3"))
                                {
                                    sb.AppendLine();
                                    sb.AppendLine($"  • {text}");
                                    sb.AppendLine();
                                }
                                else
                                {
                                    sb.AppendLine(text);
                                }
                            }
                            else
                            {
                                sb.AppendLine(text);
                            }
                        }
                        else if (element is Table table)
                        {
                            sb.AppendLine();
                            foreach (var row in table.Elements<TableRow>())
                            {
                                var cells = row.Elements<TableCell>()
                                    .Select(c => c.InnerText.Trim())
                                    .Where(t => !string.IsNullOrEmpty(t))
                                    .ToList();

                                if (cells.Any())
                                {
                                    sb.AppendLine(string.Join(" | ", cells));
                                }
                            }
                            sb.AppendLine();
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error extracting text from {path}: {ex.Message}");
                return null;
            }

            return sb.ToString();
        }
    }
}
