const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminPage.tsx', 'utf-8');

code = code.replace(
`          </div>
        </div>
        </>
      )}

        <AdminProductsList`,
`          </div>
        </div>
      )}

        <AdminProductsList`
);

code = code.replace(
`          onDuplicateProduct={copyProduct}
        />
      )}

      {/* 3. Create Product */}`,
`          onDuplicateProduct={copyProduct}
        />
        </>
      )}

      {/* 3. Create Product */}`
);

fs.writeFileSync('src/pages/AdminPage.tsx', code);
console.log("Fixed AdminPage.tsx syntax");
