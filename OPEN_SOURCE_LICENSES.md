# 开源许可证与第三方声明 (Open Source Licenses & Third-Party Notices)

本项目（SmartAR Desktop）遵循 **Mozilla Public License Version 2.0 (MPL-2.0)** 开源协议。
本软件的二进制分发版与源码集成了多个优秀的开源软件库。为遵循各依赖库的开源许可证要求（包括 Apache-2.0、BSD-3-Clause、MIT、ISC 与 MPL-2.0 中的版权声明保留与免责声明要求），特在此完整公示本项目所使用的第三方依赖及其开源许可证全文。

---

## 一、第三方开源依赖清单

### 1. Go 后端与运行时依赖

| 依赖组件 | 许可证 | 版权所有者 (Copyright) | 仓库 / 来源 |
| :--- | :--- | :--- | :--- |
| **openai-go** | Apache-2.0 | Copyright (c) 2024 OpenAI | github.com/openai/openai-go |
| **excelize/v2** | BSD-3-Clause | Copyright (c) 2016-2026 The Excelize Authors | github.com/xuri/excelize/v2 |
| **efp** | BSD-3-Clause | Copyright (c) 2024 The Excelize Authors | github.com/xuri/efp |
| **nfp** | BSD-3-Clause | Copyright (c) 2024 The Excelize Authors | github.com/xuri/nfp |
| **gjson** | MIT | Copyright (c) 2016-2026 Josh Baker | github.com/tidwall/gjson |
| **sjson** | MIT | Copyright (c) 2016-2026 Josh Baker | github.com/tidwall/sjson |
| **pretty** | MIT | Copyright (c) 2016-2026 Josh Baker | github.com/tidwall/pretty |
| **match** | MIT | Copyright (c) 2016-2026 Josh Baker | github.com/tidwall/match |
| **purego** | Apache-2.0 | Copyright (c) 2022 Ebitengine Authors | github.com/ebitengine/purego |
| **go-deepcopy** | Apache-2.0 | Copyright (c) 2023 Tien Do | github.com/tiendc/go-deepcopy |
| **mscfb** | BSD-3-Clause | Copyright (c) 2014 Richard Lehane | github.com/richardlehane/mscfb |
| **msoleps** | BSD-3-Clause | Copyright (c) 2014 Richard Lehane | github.com/richardlehane/msoleps |
| **golang.org/x/crypto** | BSD-3-Clause | Copyright (c) 2009 The Go Authors | golang.org/x/crypto |
| **golang.org/x/net** | BSD-3-Clause | Copyright (c) 2009 The Go Authors | golang.org/x/net |
| **golang.org/x/text** | BSD-3-Clause | Copyright (c) 2009 The Go Authors | golang.org/x/text |
| **mygo** | MIT / MPL-2.0 | Copyright (c) EGOIST | github.com/egoist/mygo |

### 2. 前端与界面库依赖

| 依赖组件 | 许可证 | 版权所有者 (Copyright) | 仓库 / 来源 |
| :--- | :--- | :--- | :--- |
| **React** | MIT | Copyright (c) Meta Platforms, Inc. and affiliates | github.com/facebook/react |
| **React DOM** | MIT | Copyright (c) Meta Platforms, Inc. and affiliates | github.com/facebook/react |
| **TanStack Table** | MIT | Copyright (c) 2016-present Tanner Linsley | github.com/TanStack/table |
| **Zustand** | MIT | Copyright (c) 2019 Paul Henschel | github.com/pmndrs/zustand |
| **Lucide React** | ISC | Copyright (c) 2022-present Lucide Contributors | github.com/lucide-icons/lucide |
| **Tailwind CSS** | MIT | Copyright (c) Tailwind Labs, Inc. | github.com/tailwindlabs/tailwindcss |
| **Clsx** | MIT | Copyright (c) Luke Edwards | github.com/lukeed/clsx |
| **Tailwind Merge** | MIT | Copyright (c) 2020 Dany Castillo | github.com/dcastil/tailwind-merge |
| **Vite** | MIT | Copyright (c) 2019-present Evan You & Vite Contributors | github.com/vitejs/vite |
| **TypeScript** | Apache-2.0 | Copyright (c) Microsoft Corporation | github.com/microsoft/TypeScript |

---

## 二、开源许可证全文公示 (License Texts)

### 1. Mozilla Public License Version 2.0 (MPL-2.0)

本项目 SmartAR Desktop 的主开源许可协议详见仓库根目录下的 [LICENSE](LICENSE) 文件，亦可访问 https://mozilla.org/MPL/2.0/ 查看官方原文。

```text
Mozilla Public License Version 2.0
==================================

1. Definitions
--------------
1.1. "Contributor" means each individual or legal entity that creates, contributes to
the creation of, or owns Covered Software.
1.2. "Contributor Version" means the combination of the Contributions of others (if any)
used by a Contributor and that particular Contributor's Contribution.
1.3. "Contribution" means Covered Software of a particular Contributor.
1.4. "Covered Software" means Source Code Form to which the initial Contributor has attached
the notice in Exhibit A, the Executable Form of such Source Code Form, and Modifications
of such Source Code Form, in each case including portions thereof.
... (完整条款参见 LICENSE 文件)
```

---

### 2. Apache License, Version 2.0

适用于组件：`openai-go`、`purego`、`go-deepcopy`、`TypeScript`。

```text
                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.
      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.
      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.
      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity.
      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.
      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.
      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.
      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work.
      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License.
```

---

### 3. BSD 3-Clause License

适用于组件：`excelize/v2`、`efp`、`nfp`、`mscfb`、`msoleps`、`golang.org/x/crypto`、`golang.org/x/net`、`golang.org/x/text`。

```text
Copyright (c) 2016-2026 The Excelize Authors. All rights reserved.
Copyright (c) 2009 The Go Authors. All rights reserved.
Copyright (c) 2014 Richard Lehane. All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived from
   this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

---

### 4. MIT License

适用于组件：`React`、`React DOM`、`TanStack Table`、`Zustand`、`Tailwind CSS`、`Clsx`、`Tailwind Merge`、`Vite`、`gjson`、`sjson`、`pretty`、`match`、`mygo`。

```text
MIT License

Copyright (c) Meta Platforms, Inc. and affiliates.
Copyright (c) 2016-present Tanner Linsley.
Copyright (c) 2019 Paul Henschel.
Copyright (c) Tailwind Labs, Inc.
Copyright (c) Luke Edwards.
Copyright (c) 2020 Dany Castillo.
Copyright (c) 2019-present Evan You & Vite Contributors.
Copyright (c) 2016-2026 Josh Baker.
Copyright (c) EGOIST.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

### 5. ISC License

适用于组件：`Lucide React`。

```text
ISC License

Copyright (c) 2022-present Lucide Contributors.
Portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT).

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```
