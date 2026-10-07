BEGIN TRY
BEGIN TRAN;

CREATE TABLE [dbo].[BusinessCategorySelection] (
    [id] NVARCHAR(36) NOT NULL,
    [businessId] NVARCHAR(36) NOT NULL,
    [slug] NVARCHAR(64) NOT NULL,
    [position] INT NOT NULL,
    CONSTRAINT [BusinessCategorySelection_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [BusinessCategorySelection_businessId_slug_key] UNIQUE NONCLUSTERED ([businessId], [slug]),
    CONSTRAINT [BusinessCategorySelection_businessId_position_key] UNIQUE NONCLUSTERED ([businessId], [position]),
    CONSTRAINT [BusinessCategorySelection_position_check] CHECK ([position] >= 0 AND [position] <= 3)
);

ALTER TABLE [dbo].[BusinessCategorySelection] ADD CONSTRAINT [BusinessCategorySelection_businessId_fkey]
    FOREIGN KEY ([businessId]) REFERENCES [dbo].[Business]([id])
    ON DELETE CASCADE ON UPDATE NO ACTION;

COMMIT TRAN;
END TRY
BEGIN CATCH
IF @@TRANCOUNT > 0 ROLLBACK TRAN;
THROW;
END CATCH
