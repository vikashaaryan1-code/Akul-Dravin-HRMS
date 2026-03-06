$ErrorActionPreference = "Stop"

$root = "c:\Projects\Akul Dravin HRMS\akul-dravin-hrms"
$source = Join-Path $root "PRD.md"
$outFile = Join-Path $root "AKUL_DRAVIN_HRMS_AI_SUPER_PLATFORM_V11_ADVANCED.docx"
$tmp = Join-Path $root ".tmp_prd_docx"

if (Test-Path $tmp) {
  Remove-Item $tmp -Recurse -Force
}
New-Item -ItemType Directory -Path $tmp | Out-Null
New-Item -ItemType Directory -Path (Join-Path $tmp "_rels") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $tmp "word") | Out-Null

$lines = Get-Content $source

function Escape-Xml([string]$value) {
  if ($null -eq $value) { return "" }
  return [System.Security.SecurityElement]::Escape($value)
}

$paragraphs = New-Object System.Collections.Generic.List[string]

foreach ($lineRaw in $lines) {
  $line = [string]$lineRaw

  if ([string]::IsNullOrWhiteSpace($line)) {
    $paragraphs.Add('<w:p/>')
    continue
  }

  $trimmed = $line.TrimStart()

  if ($trimmed.StartsWith('# ')) {
    $text = Escape-Xml($trimmed.Substring(2))
    $styleXml = '<w:rPr><w:b/><w:sz w:val="44"/></w:rPr>'
    $paragraphs.Add('<w:p><w:r>' + $styleXml + '<w:t xml:space="preserve">' + $text + '</w:t></w:r></w:p>')
    continue
  }

  if ($trimmed.StartsWith('## ')) {
    $text = Escape-Xml($trimmed.Substring(3))
    $styleXml = '<w:rPr><w:b/><w:sz w:val="34"/></w:rPr>'
    $paragraphs.Add('<w:p><w:r>' + $styleXml + '<w:t xml:space="preserve">' + $text + '</w:t></w:r></w:p>')
    continue
  }

  if ($trimmed.StartsWith('### ')) {
    $text = Escape-Xml($trimmed.Substring(4))
    $styleXml = '<w:rPr><w:b/><w:sz w:val="30"/></w:rPr>'
    $paragraphs.Add('<w:p><w:r>' + $styleXml + '<w:t xml:space="preserve">' + $text + '</w:t></w:r></w:p>')
    continue
  }

  $text = Escape-Xml($line)
  $paragraphs.Add('<w:p><w:r><w:t xml:space="preserve">' + $text + '</w:t></w:r></w:p>')
}

$body = [string]::Join("`n", $paragraphs)

$documentXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    $body
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>
"@

$contentTypesXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>
"@

$relsXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
"@

$utf8 = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Join-Path $tmp "[Content_Types].xml"), $contentTypesXml, $utf8)
[System.IO.File]::WriteAllText((Join-Path (Join-Path $tmp "_rels") ".rels"), $relsXml, $utf8)
[System.IO.File]::WriteAllText((Join-Path (Join-Path $tmp "word") "document.xml"), $documentXml, $utf8)

if (Test-Path $outFile) {
  Remove-Item $outFile -Force
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($tmp, $outFile)

Remove-Item $tmp -Recurse -Force
Write-Output $outFile
