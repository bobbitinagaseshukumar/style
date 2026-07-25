import os, re

dir_path = r'c:\Users\harib\Documents\kumar projects\KVLR styles\server\controllers'

for filename in os.listdir(dir_path):
    if not filename.endswith('Controller.js'): continue
    filepath = os.path.join(dir_path, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Generic fixes
    content = re.sub(r",\s*mode:\s*['\"]insensitive['\"]", '', content)
    content = re.sub(r"mode:\s*['\"]insensitive['\"]\s*,\s*", '', content)
    content = re.sub(r"mode:\s*['\"]insensitive['\"]", '', content)

    if filename == 'productController.js':
        content = content.replace('basePrice', 'price')
        content = content.replace('isFeatured', 'featured')
        content = content.replace('firstName: true, lastName: true', 'fullName: true')
        content = content.replace('isMain', 'isPrimary')
        content = re.sub(r'publicId:\s*img\.public_id,?', '', content)
        content = content.replace('if (image.publicId) {', 'if (image.url) {')
        content = content.replace('await deleteImage(image.publicId);', '// await deleteImage(image.url);')

        # Add filters
        if 'const { search, category, sort, page = 1, limit = 10 } = req.query;' in content:
            content = content.replace(
                'const { search, category, sort, page = 1, limit = 10 } = req.query;',
                'const { search, category, sort, page = 1, limit = 10, featured, trending, newArrival, bestSeller, todaysDeal, flashSale } = req.query;'
            )
            filters_code = """
    if (featured === 'true') whereClause.featured = true;
    if (trending === 'true') whereClause.trending = true;
    if (newArrival === 'true') whereClause.newArrival = true;
    if (bestSeller === 'true') whereClause.bestSeller = true;
    if (todaysDeal === 'true') whereClause.todaysDeal = true;
    if (flashSale === 'true') whereClause.flashSale = true;
"""
            content = content.replace('if (category) {', filters_code + '    if (category) {')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Done")
