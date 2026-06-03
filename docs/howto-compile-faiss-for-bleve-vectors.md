# How to compile FAISS for Bleve vector search

This document records the exact workflow used to build the `blevesearch/faiss` fork for Bleve's `vectors` build tag on Linux. It exists so we can retrace the setup later without rediscovering the same build, header, and linker issues.

## Why this is needed

Bleve vector/KNN support is behind the Go build tag:

```bash
-tags=vectors
```

When that tag is enabled, Bleve uses `github.com/blevesearch/go-faiss`, which calls the FAISS C API through CGO. That means the machine needs:

- FAISS C++ shared library: `libfaiss.so`
- FAISS C API shared library: `libfaiss_c.so`
- FAISS headers under `/usr/local/include/faiss/...`
- explicit linker flags for both `-lfaiss_c` and `-lfaiss`

## Source checkout

Use the Bleve-maintained FAISS fork, not upstream `facebookresearch/faiss`.

The commit used for Bleve v2.6.0 compatibility was:

```text
blevesearch/faiss@fff814d
```

In this workspace it was cloned here:

```bash
/home/manuel/workspaces/2026-05-27/rag-evaluation-system/faiss
```

Example checkout:

```bash
cd /home/manuel/workspaces/2026-05-27/rag-evaluation-system
git clone https://github.com/blevesearch/faiss.git faiss
cd faiss
git checkout fff814d
```

## Configure

The important details are:

- GPU disabled
- C API enabled
- shared libraries enabled
- Python disabled
- extra include path `-DCMAKE_CXX_FLAGS="-I$PWD"`

The extra include path was needed because the C API build in this fork includes headers such as `faiss/IndexIVFRaBitQ.h` from the repository source layout.

```bash
cd /home/manuel/workspaces/2026-05-27/rag-evaluation-system/faiss

rm -rf build
mkdir -p build

cmake -B build \
  -DFAISS_ENABLE_GPU=OFF \
  -DFAISS_ENABLE_C_API=ON \
  -DBUILD_SHARED_LIBS=ON \
  -DFAISS_ENABLE_PYTHON=OFF \
  -DCMAKE_INSTALL_PREFIX=/usr/local \
  -DCMAKE_CXX_FLAGS="-I$PWD" \
  .
```

## Build library targets only

If you only need Bleve/go-faiss support, these two targets are sufficient:

```bash
make -C build -j$(nproc) faiss faiss_c
```

Expected outputs:

```bash
ls -lh build/faiss/libfaiss.so build/c_api/libfaiss_c.so
```

You should see:

```text
build/faiss/libfaiss.so
build/c_api/libfaiss_c.so
```

## Optional: make the full FAISS tree build

A plain full build:

```bash
make -C build -j$(nproc)
```

may fail in `tests/test_hamming.cpp` with an error like:

```text
invalid conversion from ‘long long int*’ to ‘faiss::HeapArray<faiss::CMax<int, long int> >::TI*’ {aka ‘long int*’}
```

### Cause

`faiss::int_maxheap_array_t` expects its `ids` pointer to be exactly the heap's `TI` type. On this Linux build, that resolves to `long int*`, while the test hard-coded `std::vector<long long>`.

Both may be 64-bit, but they are different C++ types.

### Patch

Patch `tests/test_hamming.cpp` to derive the heap id type from FAISS itself.

Add after `using namespace ::testing;`:

```cpp
using HammingHeap = faiss::int_maxheap_array_t;
using HammingHeapId = HammingHeap::TI;
```

Then replace the hamming test id containers:

```cpp
std::shared_ptr<std::vector<long long>> true_ids
std::set<long> correct_ids
std::vector<long long> ids_gen(na * k)
std::vector<long long> ids_ham_knn(na * k, 0)
faiss::int_maxheap_array_t res = {na, k, ids_gen.data(), dist_gen.data()};
```

with:

```cpp
std::shared_ptr<std::vector<HammingHeapId>> true_ids
std::set<HammingHeapId> correct_ids
std::vector<HammingHeapId> ids_gen(na * k)
std::vector<HammingHeapId> ids_ham_knn(na * k, 0)
HammingHeap res = {na, k, ids_gen.data(), dist_gen.data()};
```

In this workspace, the resulting diff was:

```bash
git -C /home/manuel/workspaces/2026-05-27/rag-evaluation-system/faiss diff -- tests/test_hamming.cpp
```

### Permission trap

After patching, the next full build failed once with:

```text
fatal error: opening dependency file CMakeFiles/faiss_test.dir/test_hamming.cpp.o.d: Permission denied
```

That was caused by a stale root-owned generated dependency file in the user-owned build tree, probably from an earlier sudo invocation.

Fix:

```bash
rm -f build/tests/CMakeFiles/faiss_test.dir/test_hamming.cpp.o.d
make -C build -j$(nproc)
```

After that, the full build completed successfully, including `faiss_test`.

## Install

Install headers and libraries:

```bash
cd /home/manuel/workspaces/2026-05-27/rag-evaluation-system/faiss
sudo make -C build install
sudo ldconfig
```

Important: in our run, `make install` updated `libfaiss_c.so` and headers, but did not initially leave the fresh `libfaiss.so` in `/usr/local/lib`. We manually corrected that by ensuring `/usr/local/lib/libfaiss.so` was the fresh 14MB build from `build/faiss/libfaiss.so`.

Verify:

```bash
ls -lh \
  /usr/local/include/faiss/c_api/IndexBinary_c_ex.h \
  /usr/local/lib/libfaiss.so \
  /usr/local/lib/libfaiss_c.so

ldconfig -p | grep -E 'libfaiss(_c)?\.so'
```

Expected signs:

- `/usr/local/include/faiss/c_api/IndexBinary_c_ex.h` exists
- `/usr/local/lib/libfaiss_c.so` exists
- `/usr/local/lib/libfaiss.so` exists and is the fresh build, about 14MB
- `ldconfig -p` lists both `libfaiss.so` and `libfaiss_c.so`

## Linker caveat for Go

A plain run may still fail:

```bash
GOWORK=off go run -tags=vectors -ldflags "-r /usr/local/lib" ./cmd/experiments/bleve-knn/
```

with many undefined `faiss::...` C++ references from `/usr/local/lib/libfaiss_c.so`.

Cause: `go-faiss` contributes `-lfaiss_c`, but this build also needs explicit linkage to `libfaiss.so` and C++ runtime libraries.

Use explicit `CGO_LDFLAGS`:

```bash
export CGO_LDFLAGS="-L/usr/local/lib -lfaiss_c -lfaiss -lstdc++ -lm"
```

Then build/run with:

```bash
GOWORK=off \
CGO_LDFLAGS="-L/usr/local/lib -lfaiss_c -lfaiss -lstdc++ -lm" \
go run -tags=vectors -ldflags "-r /usr/local/lib" ./cmd/experiments/bleve-knn/
```

## Verified Bleve KNN experiment

Experiment command path:

```bash
/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/cmd/experiments/bleve-knn/main.go
```

Run:

```bash
cd /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system

GOWORK=off \
CGO_LDFLAGS="-L/usr/local/lib -lfaiss_c -lfaiss -lstdc++ -lm" \
go run -tags=vectors -ldflags "-r /usr/local/lib" ./cmd/experiments/bleve-knn/
```

Successful output includes:

```text
=== Step 3: Pure KNN search (no text query) ===
Using embedding from chunk-042 as query vector
KNN search returned 5 hits (total=5, maxScore=1.0000)
  1. id=chunk-042 score=1.000000 ...

=== Experiment complete ===
Summary: bleve KNN vector search works with the 'vectors' build tag.
```

## Troubleshooting checklist

### Missing header: `IndexBinary_c_ex.h`

Symptom:

```text
fatal error: faiss/c_api/IndexBinary_c_ex.h: No such file or directory
```

Fix:

- Ensure you cloned `blevesearch/faiss`, not upstream FAISS
- Ensure commit `fff814d`
- Run `sudo make -C build install`
- Verify `/usr/local/include/faiss/c_api/IndexBinary_c_ex.h`

### Missing header: `IndexIVFRaBitQ.h`

Symptom during FAISS C API build:

```text
fatal error: faiss/IndexIVFRaBitQ.h: No such file or directory
```

Fix: configure with:

```bash
-DCMAKE_CXX_FLAGS="-I$PWD"
```

### Full build fails in `test_hamming.cpp`

Symptom:

```text
invalid conversion from ‘long long int*’ to ... ‘long int*’
```

Fix: patch the test to use `faiss::int_maxheap_array_t::TI` as described above.

### Permission denied writing `.o.d`

Symptom:

```text
fatal error: opening dependency file ... test_hamming.cpp.o.d: Permission denied
```

Fix:

```bash
rm -f build/tests/CMakeFiles/faiss_test.dir/test_hamming.cpp.o.d
make -C build -j$(nproc)
```

If more root-owned build files exist, inspect with:

```bash
find build -user root -ls
```

### Undefined references to `faiss::...` during Go link

Symptom:

```text
/usr/bin/ld: /usr/local/lib/libfaiss_c.so: undefined reference to `faiss::...'
collect2: error: ld returned 1 exit status
```

Fix: include `-lfaiss` explicitly:

```bash
CGO_LDFLAGS="-L/usr/local/lib -lfaiss_c -lfaiss -lstdc++ -lm"
```

## Final known-good command summary

```bash
# Build FAISS
cd /home/manuel/workspaces/2026-05-27/rag-evaluation-system/faiss
rm -rf build
cmake -B build \
  -DFAISS_ENABLE_GPU=OFF \
  -DFAISS_ENABLE_C_API=ON \
  -DBUILD_SHARED_LIBS=ON \
  -DFAISS_ENABLE_PYTHON=OFF \
  -DCMAKE_INSTALL_PREFIX=/usr/local \
  -DCMAKE_CXX_FLAGS="-I$PWD" \
  .
make -C build -j$(nproc) faiss faiss_c
sudo make -C build install
sudo ldconfig

# Run Bleve vector experiment
cd /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system
make bleve-knn-experiment
```

The Makefile target wraps the long CGO command:

```bash
GOWORK=off \
CGO_LDFLAGS="-L/usr/local/lib -lfaiss_c -lfaiss -lstdc++ -lm" \
go run -tags=vectors -ldflags "-r /usr/local/lib" ./cmd/experiments/bleve-knn/
```

If FAISS is installed somewhere other than `/usr/local/lib`, override the library directory:

```bash
make bleve-knn-experiment FAISS_LIB_DIR=/path/to/faiss/lib
```
