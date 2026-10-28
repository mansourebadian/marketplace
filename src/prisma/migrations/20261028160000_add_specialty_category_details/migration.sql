BEGIN TRY
BEGIN TRAN;
ALTER TABLE [dbo].[BusinessCategorySelection] ADD [displayName] NVARCHAR(100), [color] NVARCHAR(20) NOT NULL CONSTRAINT [BusinessCategorySelection_color_df] DEFAULT N'blue', [description] NVARCHAR(255);
EXEC(N'UPDATE [dbo].[BusinessCategorySelection]
SET [displayName] = CASE WHEN [slug] = ''other'' AND [customName] IS NOT NULL THEN [customName] ELSE CASE [slug]
    WHEN ''hair-salon'' THEN N''سالن مو''
    WHEN ''nails'' THEN N''ناخن''
    WHEN ''eyebrows-lashes'' THEN N''ابرو و مژه''
    WHEN ''beauty-salon'' THEN N''سالن زیبایی''
    WHEN ''medspa'' THEN N''زیبایی پزشکی''
    WHEN ''barber'' THEN N''آرایشگاه مردانه''
    WHEN ''massage'' THEN N''ماساژ''
    WHEN ''spa-sauna'' THEN N''اسپا و سونا''
    WHEN ''waxing-salon'' THEN N''اپیلاسیون''
    WHEN ''tattoo-piercing'' THEN N''تاتو و پیرسینگ''
    WHEN ''tanning-studio'' THEN N''سولاریوم''
    WHEN ''fitness-recovery'' THEN N''تناسب اندام و ریکاوری''
    WHEN ''physical-therapy'' THEN N''فیزیوتراپی''
    WHEN ''health-practice'' THEN N''خدمات سلامت''
    WHEN ''pet-grooming'' THEN N''آرایش حیوانات خانگی''
    WHEN ''other'' THEN N''سایر''
    ELSE [slug] END END;');
COMMIT TRAN;
END TRY
BEGIN CATCH
IF @@TRANCOUNT > 0 ROLLBACK TRAN;
THROW;
END CATCH
